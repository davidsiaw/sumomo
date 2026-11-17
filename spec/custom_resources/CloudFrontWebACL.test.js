// Run: node --test spec/custom_resources/
// Executes CloudFrontWebACL.js the way custom_resource_utils.js does (as a
// code block with aws/request/context/Cloudformation/store in scope), with a
// fake WAFV2 client and an immediate setTimeout so retries don't sleep.
const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert');

const code = fs.readFileSync(
  path.join(__dirname, '../../data/sumomo/custom_resources/CloudFrontWebACL.js'), 'utf8');

const ACL_ARN = 'arn:aws:wafv2:us-east-1:111:global/webacl/stk-CDN/acl-id';
const SET_ARN = 'arn:aws:wafv2:us-east-1:111:global/ipset/stk-CDN-allow/set-id';
const PID = ACL_ARN + '|' + SET_ARN;

function awsErr(code) { const e = new Error(code); e.code = code; return e; }

// handlers: { methodName: (params, nthCall) => result | throws }
function run(request, handlers = {}) {
  return new Promise((resolve) => {
    const calls = [];
    const counts = {};
    let region;
    const aws = {
      WAFV2: function (opts) {
        region = opts.region;
        return new Proxy({}, {
          get: (_, m) => (p) => ({
            promise: async () => {
              calls.push([m, p]);
              counts[m] = (counts[m] || 0) + 1;
              if (!handlers[m]) throw new Error('unexpected call ' + m);
              return handlers[m](p, counts[m]);
            }
          })
        });
      }
    };
    const Cloudformation = {
      SUCCESS: 'SUCCESS', FAILED: 'FAILED',
      send: (req, ctx, status, data, reason, pid) => resolve({ status, data, reason, pid, calls, region })
    };
    const immediate = (fn) => Promise.resolve().then(fn);
    new Function('aws', 'request', 'context', 'Cloudformation', 'store', 'setTimeout', code)(
      aws, request, { logStreamName: 'log-stream' }, Cloudformation, {}, immediate);
  });
}

const props = { Name: 'stk-CDN', Addresses: ['198.51.100.1/32', '203.0.113.0/24'] };

const createHandlers = () => ({
  createIPSet: () => ({ Summary: { ARN: SET_ARN, Id: 'set-id', Name: 'stk-CDN-allow' } }),
  createWebACL: () => ({ Summary: { ARN: ACL_ARN, Id: 'acl-id', Name: 'stk-CDN' } })
});

test('Create builds IPSet then block-by-default WebACL in us-east-1', async () => {
  const r = await run({ RequestType: 'Create', ResourceProperties: props }, createHandlers());

  assert.equal(r.status, 'SUCCESS', r.reason);
  assert.equal(r.region, 'us-east-1');
  assert.equal(r.pid, PID);
  assert.deepEqual(r.data, { Arn: ACL_ARN, Id: 'acl-id', IPSetArn: SET_ARN });

  const [[m1, ipset], [m2, acl]] = r.calls;
  assert.equal(m1, 'createIPSet');
  assert.deepEqual(ipset, {
    Name: 'stk-CDN-allow', Scope: 'CLOUDFRONT', IPAddressVersion: 'IPV4', Addresses: props.Addresses
  });
  assert.equal(m2, 'createWebACL');
  assert.equal(acl.Name, 'stk-CDN');
  assert.equal(acl.Scope, 'CLOUDFRONT');
  assert.deepEqual(acl.DefaultAction, { Block: {} });
  assert.equal(acl.Rules.length, 1);
  assert.deepEqual(acl.Rules[0].Action, { Allow: {} });
  assert.deepEqual(acl.Rules[0].Statement, { IPSetReferenceStatement: { ARN: SET_ARN } });
});

test('Create retries createWebACL while the new IPSet is unavailable', async () => {
  const h = createHandlers();
  const ok = h.createWebACL;
  h.createWebACL = (p, n) => { if (n < 3) throw awsErr('WAFUnavailableEntityException'); return ok(p); };

  const r = await run({ RequestType: 'Create', ResourceProperties: props }, h);
  assert.equal(r.status, 'SUCCESS', r.reason);
  assert.equal(r.calls.filter(([m]) => m === 'createWebACL').length, 3);
});

test('Create reports FAILED on an unexpected error', async () => {
  const r = await run({ RequestType: 'Create', ResourceProperties: props }, {
    createIPSet: () => { throw awsErr('WAFInvalidParameterException'); }
  });
  assert.equal(r.status, 'FAILED');
  assert.match(r.reason, /WAFInvalidParameterException/);
});

test('Update with same Name updates the IPSet addresses in place', async () => {
  const newProps = { ...props, Addresses: ['192.0.2.0/24'] };
  const r = await run({
    RequestType: 'Update', PhysicalResourceId: PID, ResourceProperties: newProps, OldResourceProperties: props
  }, {
    getIPSet: () => ({ LockToken: 'tok-1' }),
    updateIPSet: () => ({})
  });

  assert.equal(r.status, 'SUCCESS', r.reason);
  assert.equal(r.pid, PID);
  assert.deepEqual(r.data, { Arn: ACL_ARN, Id: 'acl-id', IPSetArn: SET_ARN });
  assert.deepEqual(r.calls[0], ['getIPSet', { Name: 'stk-CDN-allow', Scope: 'CLOUDFRONT', Id: 'set-id' }]);
  assert.deepEqual(r.calls[1], ['updateIPSet', {
    Name: 'stk-CDN-allow', Scope: 'CLOUDFRONT', Id: 'set-id', Addresses: ['192.0.2.0/24'], LockToken: 'tok-1'
  }]);
});

test('Update retries on a stale lock token', async () => {
  const r = await run({
    RequestType: 'Update', PhysicalResourceId: PID, ResourceProperties: props, OldResourceProperties: props
  }, {
    getIPSet: (p, n) => ({ LockToken: 'tok-' + n }),
    updateIPSet: (p, n) => { if (n === 1) throw awsErr('WAFOptimisticLockException'); return {}; }
  });
  assert.equal(r.status, 'SUCCESS', r.reason);
  assert.equal(r.calls.filter(([m]) => m === 'updateIPSet').at(-1)[1].LockToken, 'tok-2');
});

test('Update with a new Name creates a fresh pair (CFN then deletes the old one)', async () => {
  const newProps = { ...props, Name: 'stk-Other' };
  const r = await run({
    RequestType: 'Update', PhysicalResourceId: PID, ResourceProperties: newProps, OldResourceProperties: props
  }, createHandlers());
  assert.equal(r.status, 'SUCCESS', r.reason);
  assert.deepEqual(r.calls.map(([m]) => m), ['createIPSet', 'createWebACL']);
  assert.equal(r.calls[0][1].Name, 'stk-Other-allow');
});

const deleteHandlers = () => ({
  getWebACL: () => ({ LockToken: 'acl-tok' }),
  deleteWebACL: () => ({}),
  getIPSet: () => ({ LockToken: 'set-tok' }),
  deleteIPSet: () => ({})
});

test('Delete removes WebACL then IPSet', async () => {
  const r = await run({ RequestType: 'Delete', PhysicalResourceId: PID, ResourceProperties: props }, deleteHandlers());
  assert.equal(r.status, 'SUCCESS', r.reason);
  assert.deepEqual(r.calls.map(([m]) => m), ['getWebACL', 'deleteWebACL', 'getIPSet', 'deleteIPSet']);
  assert.deepEqual(r.calls[1][1], { Name: 'stk-CDN', Scope: 'CLOUDFRONT', Id: 'acl-id', LockToken: 'acl-tok' });
  assert.deepEqual(r.calls[3][1], { Name: 'stk-CDN-allow', Scope: 'CLOUDFRONT', Id: 'set-id', LockToken: 'set-tok' });
});

test('Delete retries while the WebACL is still associated with a distribution', async () => {
  const h = deleteHandlers();
  h.deleteWebACL = (p, n) => { if (n < 3) throw awsErr('WAFAssociatedItemException'); return {}; };
  const r = await run({ RequestType: 'Delete', PhysicalResourceId: PID, ResourceProperties: props }, h);
  assert.equal(r.status, 'SUCCESS', r.reason);
  assert.equal(r.calls.filter(([m]) => m === 'deleteWebACL').length, 3);
});

test('Delete treats already-gone resources as success', async () => {
  const gone = () => { throw awsErr('WAFNonexistentItemException'); };
  const r = await run({ RequestType: 'Delete', PhysicalResourceId: PID, ResourceProperties: props },
    { getWebACL: gone, getIPSet: gone });
  assert.equal(r.status, 'SUCCESS', r.reason);
});

test('Delete of a resource whose Create never succeeded is a no-op', async () => {
  const r = await run({ RequestType: 'Delete', PhysicalResourceId: 'log-stream', ResourceProperties: props });
  assert.equal(r.status, 'SUCCESS', r.reason);
  assert.equal(r.calls.length, 0);
});
