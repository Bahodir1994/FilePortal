'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

// Modified version of S.js[https://github.com/adamhaile/S] by Adam Haile
// Comparator memos from VSJolund fork https://github.com/VSjolund/vs-bind
// Public interface
function createSignal(value, comparator) {
  const d = new DataNode(value);
  let setter;

  if (comparator) {
    let age = -1;

    setter = v => {
      if (!comparator(value, v)) {
        const time = RootClock.time;

        if (time === age) {
          throw new Error(`Conflicting value update: ${v} is not the same as ${value}`);
        }

        age = time;
        value = v;
        d.next(v);
      }
    };
  } else setter = d.next.bind(d);

  return [d.current.bind(d), setter];
}
function createEffect(fn, value) {
  createComputationNode(fn, value);
}
function createDependentEffect(fn, deps, defer) {
  if (Array.isArray(deps)) deps = callAll(deps);
  defer = !!defer;
  createEffect(value => {
    const listener = Listener;
    deps();
    if (defer) defer = false;else {
      Listener = null;
      value = fn(value);
      Listener = listener;
    }
    return value;
  });
}
function createMemo(fn, value, comparator) {
  var node = createComputationNode(fn, value);
  node.comparator = comparator || null;
  return () => {
    if (Listener !== null) {
      const state = node.state;

      if ((state & 7) !== 0) {
        liftComputation(node);
      }

      if (node.age === RootClock.time && state === 8) {
        throw new Error("Circular dependency.");
      }

      if ((state & 16) === 0) {
        if (node.log === null) node.log = createLog();
        logRead(node.log);
      }
    }

    return node.value;
  };
}
function createRoot(fn, detachedOwner) {
  detachedOwner && (Owner = detachedOwner);

  let owner = Owner,
      listener = Listener,
      root = fn.length === 0 ? UNOWNED : createComputationNode(null, null),
      result = undefined,
      disposer = function _dispose() {
    if (RunningClock !== null) {
      RootClock.disposes.add(root);
    } else {
      dispose(root);
    }
  };

  Owner = root;
  Listener = null;

  try {
    result = fn(disposer);
  } finally {
    Listener = listener;
    Owner = owner;
  }

  return result;
}
function freeze(fn) {
  let result = undefined;
  if (RunningClock !== null) result = fn();else {
    RunningClock = RootClock;
    RunningClock.changes.reset();

    try {
      result = fn();
      event();
    } finally {
      RunningClock = null;
    }
  }
  return result;
}
function sample(fn) {
  let result,
      listener = Listener;
  Listener = null;
  result = fn();
  Listener = listener;
  return result;
}
function onCleanup(fn) {
  if (Owner === null) console.warn("cleanups created without a root or parent will never be run");else if (Owner.cleanups === null) Owner.cleanups = [fn];else Owner.cleanups.push(fn);
}
function afterEffects(fn) {
  Promise.resolve().then(fn);
}
function isListening() {
  return Listener !== null;
} // context API

function createContext(defaultValue) {
  const id = Symbol("context");
  return {
    id,
    Provider: createProvider(id),
    defaultValue
  };
}
function useContext(context) {
  return lookup(Owner, context.id) || context.defaultValue;
}
function getContextOwner() {
  return Owner;
} // Internal implementation
/// Graph classes and operations

class DataNode {
  constructor(value) {
    this.value = value;
    this.pending = NOTPENDING;
    this.log = null;
  }

  current() {
    if (Listener !== null) {
      if (this.log === null) this.log = createLog();
      logRead(this.log);
    }

    return this.value;
  }

  next(value) {
    if (RunningClock !== null) {
      if (this.pending !== NOTPENDING) {
        // value has already been set once, check for conflicts
        if (value !== this.pending) {
          throw new Error("conflicting changes: " + value + " !== " + this.pending);
        }
      } else {
        // add to list of changes
        this.pending = value;
        RootClock.changes.add(this);
      }
    } else {
      // not batching, respond to change now
      if (this.log !== null) {
        this.pending = value;
        RootClock.changes.add(this);
        event();
      } else {
        this.value = value;
      }
    }

    return value;
  }

}

function createComputationNode(fn, value) {
  const node = {
    fn,
    value,
    age: RootClock.time,
    state: 0,
    comparator: null,
    source1: null,
    source1slot: 0,
    sources: null,
    sourceslots: null,
    dependents: null,
    dependentslot: 0,
    dependentcount: 0,
    owner: Owner,
    owned: null,
    log: null,
    context: null,
    cleanups: null
  };
  if (fn === null) return node;
  let owner = Owner,
      listener = Listener;
  if (owner === null) console.warn("computations created without a root or parent will never be disposed");
  Owner = Listener = node;

  if (RunningClock === null) {
    toplevelComputation(node);
  } else {
    node.value = node.fn(node.value);
  }

  if (owner && owner !== UNOWNED) {
    if (owner.owned === null) owner.owned = [node];else owner.owned.push(node);
  }

  Owner = owner;
  Listener = listener;
  return node;
}

function createClock() {
  return {
    time: 0,
    changes: new Queue(),
    // batched changes to data nodes
    updates: new Queue(),
    // computations to update
    disposes: new Queue() // disposals to run after current batch of updates finishes

  };
}

function createLog() {
  return {
    node1: null,
    node1slot: 0,
    nodes: null,
    nodeslots: null
  };
}

class Queue {
  constructor() {
    this.items = [];
    this.count = 0;
  }

  reset() {
    this.count = 0;
  }

  add(item) {
    this.items[this.count++] = item;
  }

  run(fn) {
    let items = this.items;

    for (let i = 0; i < this.count; i++) {
      fn(items[i]);
      items[i] = null;
    }

    this.count = 0;
  }

} // "Globals" used to keep track of current system state


let RootClock = createClock(),
    RunningClock = null,
    // currently running clock
Listener = null,
    // currently listening computation
Owner = null,
    // owner for new computations
Pending = null; // pending node
// Constants

let NOTPENDING = {},
    UNOWNED = createComputationNode(null, null); // State
// 1 - Stale, 2 - Pending, 4 - Pending Disposal, 8 - Running, 16 - Disposed
// Functions

function callAll(ss) {
  return function all() {
    for (let i = 0; i < ss.length; i++) ss[i]();
  };
}

function lookup(owner, key) {
  return owner && (owner.context && owner.context[key] || owner.owner && lookup(owner.owner, key));
}

function resolveChildren(children) {
  if (typeof children === "function") return createMemo(children);

  if (Array.isArray(children)) {
    const results = [];

    for (let i = 0; i < children.length; i++) {
      let result = resolveChildren(children[i]);
      Array.isArray(result) ? results.push.apply(results, result) : results.push(result);
    }

    return results;
  }

  return children;
}

function createProvider(id) {
  return function provider(props) {
    let rendered;
    createComputationNode(() => {
      Owner.context = {
        [id]: props.value
      };
      rendered = sample(() => resolveChildren(props.children));
    });
    return rendered;
  };
}

function logRead(from) {
  let to = Listener,
      fromslot,
      toslot = to.source1 === null ? -1 : to.sources === null ? 0 : to.sources.length;

  if (from.node1 === null) {
    from.node1 = to;
    from.node1slot = toslot;
    fromslot = -1;
  } else if (from.nodes === null) {
    if (from.node1 === to) return;
    from.nodes = [to];
    from.nodeslots = [toslot];
    fromslot = 0;
  } else {
    fromslot = from.nodes.length;
    if (from.nodes[fromslot - 1] === to) return;
    from.nodes.push(to);
    from.nodeslots.push(toslot);
  }

  if (to.source1 === null) {
    to.source1 = from;
    to.source1slot = fromslot;
  } else if (to.sources === null) {
    to.sources = [from];
    to.sourceslots = [fromslot];
  } else {
    to.sources.push(from);
    to.sourceslots.push(fromslot);
  }
}

function liftComputation(node) {
  if ((node.state & 6) !== 0) {
    applyUpstreamUpdates(node);
  }

  if ((node.state & 1) !== 0) {
    updateNode(node);
  }

  resetComputation(node, 31);
}

function event() {
  // b/c we might be under a top level S.root(), have to preserve current root
  let owner = Owner;
  RootClock.updates.reset();
  RootClock.time++;

  try {
    run(RootClock);
  } finally {
    RunningClock = Listener = null;
    Owner = owner;
  }
}

function toplevelComputation(node) {
  RunningClock = RootClock;
  RootClock.changes.reset();
  RootClock.updates.reset();

  try {
    node.value = node.fn(node.value);

    if (RootClock.changes.count > 0 || RootClock.updates.count > 0) {
      RootClock.time++;
      run(RootClock);
    }
  } finally {
    RunningClock = Owner = Listener = null;
  }
}

function run(clock) {
  let running = RunningClock,
      count = 0;
  RunningClock = clock;
  clock.disposes.reset(); // for each batch ...

  while (clock.changes.count !== 0 || clock.updates.count !== 0 || clock.disposes.count !== 0) {
    if (count > 0) // don't tick on first run, or else we expire already scheduled updates
      clock.time++;
    clock.changes.run(applyDataChange);
    clock.updates.run(updateNode);
    clock.disposes.run(dispose); // if there are still changes after excessive batches, assume runaway

    if (count++ > 1e5) {
      throw new Error("Runaway clock detected");
    }
  }

  RunningClock = running;
}

function applyDataChange(data) {
  data.value = data.pending;
  data.pending = NOTPENDING;
  if (data.log) setComputationState(data.log, stateStale);
}

function updateNode(node) {
  const state = node.state;

  if ((state & 16) === 0) {
    if ((state & 2) !== 0) {
      node.dependents[node.dependentslot++] = null;

      if (node.dependentslot === node.dependentcount) {
        resetComputation(node, 14);
      }
    } else if ((state & 1) !== 0) {
      if ((state & 4) !== 0) {
        liftComputation(node);
      } else if (node.comparator) {
        const current = updateComputation(node);
        const comparator = node.comparator;

        if (!comparator(current, node.value)) {
          markDownstreamComputations(node, false, true);
        }
      } else {
        updateComputation(node);
      }
    }
  }
}

function updateComputation(node) {
  const value = node.value,
        owner = Owner,
        listener = Listener;
  Owner = Listener = node;
  node.state = 8;
  cleanupNode(node, false);
  node.value = node.fn(node.value);
  resetComputation(node, 31);
  Owner = owner;
  Listener = listener;
  return value;
}

function stateStale(node) {
  const time = RootClock.time;

  if (node.age < time) {
    node.state |= 1;
    node.age = time;
    setDownstreamState(node, !!node.comparator);
  }
}

function statePending(node) {
  const time = RootClock.time;

  if (node.age < time) {
    node.state |= 2;
    let dependents = node.dependents || (node.dependents = []);
    dependents[node.dependentcount++] = Pending;
    setDownstreamState(node, true);
  }
}

function pendingStateStale(node) {
  if ((node.state & 2) !== 0) {
    node.state = 1;
    const time = RootClock.time;

    if (node.age < time) {
      node.age = time;

      if (!node.comparator) {
        markDownstreamComputations(node, false, true);
      }
    }
  }
}

function setDownstreamState(node, pending) {
  RootClock.updates.add(node);

  if (node.comparator) {
    const pending = Pending;
    Pending = node;
    markDownstreamComputations(node, true, false);
    Pending = pending;
  } else {
    markDownstreamComputations(node, pending, false);
  }
}

function markDownstreamComputations(node, onchange, dirty) {
  const owned = node.owned;

  if (owned !== null) {
    const pending = onchange && !dirty;
    markForDisposal(owned, pending, RootClock.time);
  }

  const log = node.log;

  if (log !== null) {
    setComputationState(log, dirty ? pendingStateStale : onchange ? statePending : stateStale);
  }
}

function setComputationState(log, stateFn) {
  const node1 = log.node1,
        nodes = log.nodes;
  if (node1 !== null) stateFn(node1);

  if (nodes !== null) {
    for (let i = 0, ln = nodes.length; i < ln; i++) {
      stateFn(nodes[i]);
    }
  }
}

function markForDisposal(children, pending, time) {
  for (let i = 0, ln = children.length; i < ln; i++) {
    const child = children[i];

    if (child !== null) {
      if (pending) {
        if ((child.state & 16) === 0) {
          child.state |= 4;
        }
      } else {
        child.age = time;
        child.state = 16;
      }

      const owned = child.owned;
      if (owned !== null) markForDisposal(owned, pending, time);
    }
  }
}

function applyUpstreamUpdates(node) {
  if ((node.state & 4) !== 0) {
    const owner = node.owner;
    if ((owner.state & 7) !== 0) liftComputation(owner);
    node.state &= ~4;
  }

  if ((node.state & 2) !== 0) {
    const slots = node.dependents;

    for (let i = node.dependentslot, ln = node.dependentcount; i < ln; i++) {
      const slot = slots[i];
      if (slot != null) liftComputation(slot);
      slots[i] = null;
    }

    node.state &= ~2;
  }
}

function cleanupNode(node, final) {
  let source1 = node.source1,
      sources = node.sources,
      sourceslots = node.sourceslots,
      cleanups = node.cleanups,
      owned = node.owned,
      i,
      len;

  if (cleanups !== null) {
    for (i = 0; i < cleanups.length; i++) {
      cleanups[i](final);
    }

    node.cleanups = null;
  }

  if (owned !== null) {
    for (i = 0; i < owned.length; i++) {
      dispose(owned[i]);
    }

    node.owned = null;
  }

  if (source1 !== null) {
    cleanupSource(source1, node.source1slot);
    node.source1 = null;
  }

  if (sources !== null) {
    for (i = 0, len = sources.length; i < len; i++) {
      cleanupSource(sources.pop(), sourceslots.pop());
    }
  }
}

function cleanupSource(source, slot) {
  let nodes = source.nodes,
      nodeslots = source.nodeslots,
      last,
      lastslot;

  if (slot === -1) {
    source.node1 = null;
  } else {
    last = nodes.pop();
    lastslot = nodeslots.pop();

    if (slot !== nodes.length) {
      nodes[slot] = last;
      nodeslots[slot] = lastslot;

      if (lastslot === -1) {
        last.source1slot = slot;
      } else {
        last.sourceslots[lastslot] = slot;
      }
    }
  }
}

function resetComputation(node, flags) {
  node.state &= ~flags;
  node.dependentslot = 0;
  node.dependentcount = 0;
}

function dispose(node) {
  node.fn = null;
  node.log = null;
  node.dependents = null;
  cleanupNode(node, true);
  resetComputation(node, 31);
}

const SNODE = Symbol("solid-node"),
      SPROXY = Symbol("solid-proxy");

function wrap(value) {
  return value[SPROXY] || (value[SPROXY] = new Proxy(value, proxyTraps));
}

function isWrappable(obj) {
  return obj != null && typeof obj === "object" && (obj.__proto__ === Object.prototype || Array.isArray(obj));
}
function unwrap(item) {
  let result, unwrapped, v;
  if (result = item != null && item._state) return result;
  if (!isWrappable(item)) return item;

  if (Array.isArray(item)) {
    if (Object.isFrozen(item)) item = item.slice(0);

    for (let i = 0, l = item.length; i < l; i++) {
      v = item[i];
      if ((unwrapped = unwrap(v)) !== v) item[i] = unwrapped;
    }
  } else {
    if (Object.isFrozen(item)) item = Object.assign({}, item);
    let keys = Object.keys(item);

    for (let i = 0, l = keys.length; i < l; i++) {
      v = item[keys[i]];
      if ((unwrapped = unwrap(v)) !== v) item[keys[i]] = unwrapped;
    }
  }

  return item;
}

function getDataNodes(target) {
  let nodes = target[SNODE];
  if (!nodes) target[SNODE] = nodes = {};
  return nodes;
}

const proxyTraps = {
  get(target, property) {
    if (property === "_state") return target;
    if (property === SPROXY || property === SNODE) return;
    const value = target[property],
          wrappable = isWrappable(value);

    if (isListening() && (typeof value !== "function" || target.hasOwnProperty(property))) {
      let nodes, node;

      if (wrappable && (nodes = getDataNodes(value))) {
        node = nodes._ || (nodes._ = new DataNode());
        node.current();
      }

      nodes = getDataNodes(target);
      node = nodes[property] || (nodes[property] = new DataNode());
      node.current();
    }

    return wrappable ? wrap(value) : value;
  },

  set() {
    return true;
  },

  deleteProperty() {
    return true;
  }

};
function setProperty(state, property, value, force) {
  let unwrappedValue = unwrap(value);
  if (!force && state[property] === unwrappedValue) return;
  const notify = Array.isArray(state) || !(property in state);

  if (unwrappedValue === void 0) {
    delete state[property];
  } else state[property] = unwrappedValue;

  let nodes = getDataNodes(state),
      node;
  (node = nodes[property]) && node.next();
  notify && (node = nodes._) && node.next();
}

function mergeState(state, value, force) {
  const keys = Object.keys(value);

  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    setProperty(state, key, value[key], force);
  }
}

function updatePath(current, path, traversed = [], force) {
  if (path.length === 1) {
    let value = path[0];

    if (typeof value === "function") {
      value = value(wrap(current), traversed); // reconciled

      if (value === undefined) return;
    }

    mergeState(current, value, force);
    return;
  }

  const part = path.shift(),
        partType = typeof part,
        isArray = Array.isArray(current);

  if (Array.isArray(part)) {
    // Ex. update('data', [2, 23], 'label', l => l + ' !!!');
    for (let i = 0; i < part.length; i++) {
      updatePath(current, [part[i]].concat(path), traversed.concat([part[i]]), force);
    }
  } else if (isArray && partType === "function") {
    // Ex. update('data', i => i.id === 42, 'label', l => l + ' !!!');
    for (let i = 0; i < current.length; i++) {
      if (part(current[i], i)) updatePath(current, [i].concat(path), traversed.concat([i]), force);
    }
  } else if (isArray && partType === "object") {
    // Ex. update('data', { from: 3, to: 12, by: 2 }, 'label', l => l + ' !!!');
    const {
      from = 0,
      to = current.length - 1,
      by = 1
    } = part;

    for (let i = from; i <= to; i += by) {
      updatePath(current, [i].concat(path), traversed.concat([i]), force);
    }
  } else if (path.length === 1) {
    let value = path[0];

    if (typeof value === "function") {
      const currentPart = current[part];
      value = value(isWrappable(currentPart) ? wrap(currentPart) : currentPart, traversed.concat([part]));
    }

    if (isWrappable(current[part]) && isWrappable(value) && !Array.isArray(value)) {
      mergeState(current[part], value, force);
    } else setProperty(current, part, value, force);
  } else updatePath(current[part], path, traversed.concat([part]), force);
}

function createState(state) {
  const unwrappedState = unwrap(state || {});
  const wrappedState = wrap(unwrappedState);

  function setState(...args) {
    freeze(() => {
      if (Array.isArray(args[0])) {
        for (let i = 0; i < args.length; i += 1) {
          updatePath(unwrappedState, args[i]);
        }
      } else updatePath(unwrappedState, args);
    });
  }

  return [wrappedState, setState];
} // force state change even if value hasn't changed

function force(...args) {
  return state => {
    state = unwrap(state);

    if (Array.isArray(args[0])) {
      for (let i = 0; i < args.length; i += 1) {
        updatePath(state, args[i], [], true);
      }
    } else updatePath(state, args, [], true);
  };
}

function applyState(target, parent, property, merge, key) {
  let previous = parent[property];
  if (target === previous) return;

  if (!isWrappable(target) || !isWrappable(previous) || key && target[key] !== previous[key]) {
    target !== previous && setProperty(parent, property, target);
    return;
  }

  if (Array.isArray(target)) {
    if (target.length && previous.length && (!merge || key && target[0][key] != null)) {
      let i, j, start, end, newEnd, item, newIndicesNext, keyVal; // common prefix

      for (start = 0, end = Math.min(previous.length, target.length); start < end && (previous[start] === target[start] || key && previous[start][key] === target[start][key]); start++) {
        applyState(target[start], previous, start, merge, key);
      }

      const temp = new Array(target.length),
            newIndices = new Map(); // common suffix

      for (end = previous.length - 1, newEnd = target.length - 1; end >= start && newEnd >= start && (previous[end] === target[newEnd] || key && previous[end][key] === target[newEnd][key]); end--, newEnd--) {
        temp[newEnd] = previous[end];
      } // insert any remaining updates and remove any remaining nodes and we're done


      if (start > newEnd || start > end) {
        for (j = start; j <= newEnd; j++) setProperty(previous, j, target[j]);

        for (; j < target.length; j++) {
          setProperty(previous, j, temp[j]);
          applyState(target[j], previous, j, merge, key);
        }

        if (previous.length > target.length) setProperty(previous, "length", target.length);
        return;
      } // prepare a map of all indices in target


      newIndicesNext = new Array(newEnd + 1);

      for (j = newEnd; j >= start; j--) {
        item = target[j];
        keyVal = key ? item[key] : item;
        i = newIndices.get(keyVal);
        newIndicesNext[j] = i === undefined ? -1 : i;
        newIndices.set(keyVal, j);
      } // step through all old items to check reuse


      for (i = start; i <= end; i++) {
        item = previous[i];
        keyVal = key ? item[key] : item;
        j = newIndices.get(keyVal);

        if (j !== undefined && j !== -1) {
          temp[j] = previous[i];
          j = newIndicesNext[j];
          newIndices.set(keyVal, j);
        }
      } // set all the new values


      for (j = start; j < target.length; j++) {
        if (j in temp) {
          setProperty(previous, j, temp[j]);
          applyState(target[j], previous, j, merge, key);
        } else setProperty(previous, j, target[j]);
      }
    } else {
      for (let i = 0, len = target.length; i < len; i++) {
        applyState(target[i], previous, i, merge, key);
      }
    }

    if (previous.length > target.length) setProperty(previous, "length", target.length);
    return;
  }

  const targetKeys = Object.keys(target);

  for (let i = 0, len = targetKeys.length; i < len; i++) {
    applyState(target[targetKeys[i]], previous, targetKeys[i], merge, key);
  }

  const previousKeys = Object.keys(previous);

  for (let i = 0, len = previousKeys.length; i < len; i++) {
    if (target[previousKeys[i]] === undefined) setProperty(previous, previousKeys[i], undefined);
  }
} // Diff method for setState


function reconcile(path, options = {}) {
  let value;

  if (Array.isArray(path)) {
    value = path.pop();
  } else if (typeof path === "object") {
    value = path;
    path = undefined;
  } else {
    path = Array.prototype.slice.call(arguments, 0, -1), value = arguments[arguments.length - 1];
    options = {};
  }

  const {
    merge,
    key = "id"
  } = options;
  return state => {
    state = unwrap(state);

    if (path) {
      for (let i = 0; i < path.length - 1; i += 1) state = state[path[i]];

      applyState(value, state, path[path.length - 1], merge, key);
    } else applyState(value, {
      state
    }, "state", merge, key);
  };
}

const FALLBACK = Symbol("fallback");
function pipe(...fns) {
  if (!fns) return i => i;
  if (fns.length === 1) return fns[0];
  return input => fns.reduce((prev, fn) => fn(prev), input);
} // Modified version of mapSample from S-array[https://github.com/adamhaile/S-array] by Adam Haile

function map(mapFn, fallback) {
  return list => {
    let items = [],
        mapped = [],
        disposers = [],
        len = 0;
    onCleanup(() => {
      for (let i = 0, length = disposers.length; i < length; i++) disposers[i]();
    });
    return () => {
      let newItems = list() || [],
          i,
          j;
      return sample(() => {
        let newLen = newItems.length,
            newIndices,
            newIndicesNext,
            temp,
            tempdisposers,
            start,
            end,
            newEnd,
            item; // fast path for empty arrays

        if (newLen === 0) {
          if (len !== 0) {
            for (i = 0; i < len; i++) disposers[i]();

            disposers = [];
            items = [];
            mapped = [];
            len = 0;
          }

          if (fallback) {
            items = [FALLBACK];
            mapped[0] = createRoot(disposer => {
              disposers[0] = disposer;
              return fallback();
            });
            len = 1;
          }
        } // fast path for new create
        else if (len === 0) {
            for (j = 0; j < newLen; j++) {
              items[j] = newItems[j];
              mapped[j] = createRoot(mapper);
            }

            len = newLen;
          } else {
            temp = new Array(newLen);
            tempdisposers = new Array(newLen); // skip common prefix

            for (start = 0, end = Math.min(len, newLen); start < end && items[start] === newItems[start]; start++); // common suffix


            for (end = len - 1, newEnd = newLen - 1; end >= start && newEnd >= start && items[end] === newItems[newEnd]; end--, newEnd--) {
              temp[newEnd] = mapped[end];
              tempdisposers[newEnd] = disposers[end];
            } // remove any remaining nodes and we're done


            if (start > newEnd) {
              for (j = end; start <= j; j--) disposers[j]();

              const rLen = end - start + 1;

              if (rLen > 0) {
                mapped.splice(start, rLen);
                disposers.splice(start, rLen);
              }

              items = newItems.slice(0);
              len = newLen;
              return mapped;
            } // insert any remaining updates and we're done


            if (start > end) {
              for (j = start; j <= newEnd; j++) mapped[j] = createRoot(mapper);

              for (; j < newLen; j++) {
                mapped[j] = temp[j];
                disposers[j] = tempdisposers[j];
              }

              items = newItems.slice(0);
              len = newLen;
              return mapped;
            } // 0) prepare a map of all indices in newItems, scanning backwards so we encounter them in natural order


            newIndices = new Map();
            newIndicesNext = new Array(newEnd + 1);

            for (j = newEnd; j >= start; j--) {
              item = newItems[j];
              i = newIndices.get(item);
              newIndicesNext[j] = i === undefined ? -1 : i;
              newIndices.set(item, j);
            } // 1) step through all old items and see if they can be found in the new set; if so, save them in a temp array and mark them moved; if not, exit them


            for (i = start; i <= end; i++) {
              item = items[i];
              j = newIndices.get(item);

              if (j !== undefined && j !== -1) {
                temp[j] = mapped[i];
                tempdisposers[j] = disposers[i];
                j = newIndicesNext[j];
                newIndices.set(item, j);
              } else disposers[i]();
            } // 2) set all the new values, pulling from the temp array if copied, otherwise entering the new value


            for (j = start; j < newLen; j++) {
              if (j in temp) {
                mapped[j] = temp[j];
                disposers[j] = tempdisposers[j];
              } else mapped[j] = createRoot(mapper);
            } // 3) in case the new set is shorter than the old, set the length of the mapped array


            len = mapped.length = newLen; // 4) save a copy of the mapped items for the next update

            items = newItems.slice(0);
          }

        return mapped;
      });

      function mapper(disposer) {
        disposers[j] = disposer;
        return mapFn(newItems[j], j);
      }
    };
  };
}
function reduce(fn, seed) {
  return list => () => {
    let newList = list() || [],
        result = seed;
    return sample(() => {
      for (let i = 0; i < newList.length; i++) {
        result = fn(result, newList[i], i);
      }

      return result;
    });
  };
}

function setDefaults(props, defaultProps) {
  const propKeys = Object.keys(defaultProps);

  for (let i = 0; i < propKeys.length; i++) {
    const key = propKeys[i];
    !(key in props) && (props[key] = defaultProps[key]);
  }
}

const SuspenseContext = createContext({
  state: () => "running"
}); // lazy load a function component asynchronously

function lazy(fn) {
  return props => {
    const result = loadResource(fn().then(mod => mod.default));
    let Comp;
    return createMemo(() => (Comp = result.data) && sample(() => Comp(props)));
  };
} // load any async resource

function loadResource(resource) {
  const {
    increment,
    decrement
  } = useContext(SuspenseContext);
  const [state, setState] = createState({
    loading: false
  });

  function doRequest(p, ref) {
    setState({
      loading: true
    });
    increment && increment();
    p.then(data => !(ref && ref.cancelled) && setState({
      data,
      loading: false
    })).catch(error => setState({
      error,
      loading: false
    })).finally(() => decrement && decrement());
  }

  if (typeof resource === "function") {
    createEffect(() => {
      let ref = {
        cancelled: false
      },
          res = resource();
      if (!res) return setState({
        data: undefined,
        loading: false
      });
      doRequest(res, ref);
      onCleanup(() => ref.cancelled = true);
    });
  } else doRequest(resource);

  return state;
}

exports.SuspenseContext = SuspenseContext;
exports.afterEffects = afterEffects;
exports.createContext = createContext;
exports.createDependentEffect = createDependentEffect;
exports.createEffect = createEffect;
exports.createMemo = createMemo;
exports.createRoot = createRoot;
exports.createSignal = createSignal;
exports.createState = createState;
exports.force = force;
exports.freeze = freeze;
exports.getContextOwner = getContextOwner;
exports.isListening = isListening;
exports.lazy = lazy;
exports.loadResource = loadResource;
exports.map = map;
exports.onCleanup = onCleanup;
exports.pipe = pipe;
exports.reconcile = reconcile;
exports.reduce = reduce;
exports.sample = sample;
exports.setDefaults = setDefaults;
exports.unwrap = unwrap;
exports.useContext = useContext;