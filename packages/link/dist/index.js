(() => {
  // packages/support/resources/js/utils.js
  function registerExtension(id, callback) {
    if (id === void 0) {
      throw new Error("id can't be undefined when registering an extension");
    }
    if (callback === void 0) {
      throw new Error("callback can't be undefined when registering an extension");
    }
    document.addEventListener("alpine:init", () => {
      const ext = callback(window.talltapRegistry.getConfig(id));
      if (Array.isArray(ext)) {
        for (const extElement of ext) {
          window.talltapRegistry.register(extElement);
        }
      } else {
        window.talltapRegistry.register(ext);
      }
    });
  }

  // node_modules/prosemirror-model/dist/index.js
  function findDiffStart(a, b, pos) {
    for (let i = 0; ; i++) {
      if (i == a.childCount || i == b.childCount)
        return a.childCount == b.childCount ? null : pos;
      let childA = a.child(i), childB = b.child(i);
      if (childA == childB) {
        pos += childA.nodeSize;
        continue;
      }
      if (!childA.sameMarkup(childB))
        return pos;
      if (childA.isText && childA.text != childB.text) {
        for (let j = 0; childA.text[j] == childB.text[j]; j++)
          pos++;
        return pos;
      }
      if (childA.content.size || childB.content.size) {
        let inner = findDiffStart(childA.content, childB.content, pos + 1);
        if (inner != null)
          return inner;
      }
      pos += childA.nodeSize;
    }
  }
  function findDiffEnd(a, b, posA, posB) {
    for (let iA = a.childCount, iB = b.childCount; ; ) {
      if (iA == 0 || iB == 0)
        return iA == iB ? null : { a: posA, b: posB };
      let childA = a.child(--iA), childB = b.child(--iB), size = childA.nodeSize;
      if (childA == childB) {
        posA -= size;
        posB -= size;
        continue;
      }
      if (!childA.sameMarkup(childB))
        return { a: posA, b: posB };
      if (childA.isText && childA.text != childB.text) {
        let same = 0, minSize = Math.min(childA.text.length, childB.text.length);
        while (same < minSize && childA.text[childA.text.length - same - 1] == childB.text[childB.text.length - same - 1]) {
          same++;
          posA--;
          posB--;
        }
        return { a: posA, b: posB };
      }
      if (childA.content.size || childB.content.size) {
        let inner = findDiffEnd(childA.content, childB.content, posA - 1, posB - 1);
        if (inner)
          return inner;
      }
      posA -= size;
      posB -= size;
    }
  }
  var Fragment = class _Fragment {
    /**
    @internal
    */
    constructor(content, size) {
      this.content = content;
      this.size = size || 0;
      if (size == null)
        for (let i = 0; i < content.length; i++)
          this.size += content[i].nodeSize;
    }
    /**
    Invoke a callback for all descendant nodes between the given two
    positions (relative to start of this fragment). Doesn't descend
    into a node when the callback returns `false`.
    */
    nodesBetween(from, to, f, nodeStart = 0, parent) {
      for (let i = 0, pos = 0; pos < to; i++) {
        let child = this.content[i], end = pos + child.nodeSize;
        if (end > from && f(child, nodeStart + pos, parent || null, i) !== false && child.content.size) {
          let start = pos + 1;
          child.nodesBetween(Math.max(0, from - start), Math.min(child.content.size, to - start), f, nodeStart + start);
        }
        pos = end;
      }
    }
    /**
    Call the given callback for every descendant node. `pos` will be
    relative to the start of the fragment. The callback may return
    `false` to prevent traversal of a given node's children.
    */
    descendants(f) {
      this.nodesBetween(0, this.size, f);
    }
    /**
    Extract the text between `from` and `to`. See the same method on
    [`Node`](https://prosemirror.net/docs/ref/#model.Node.textBetween).
    */
    textBetween(from, to, blockSeparator, leafText) {
      let text = "", separated = true;
      this.nodesBetween(from, to, (node, pos) => {
        if (node.isText) {
          text += node.text.slice(Math.max(from, pos) - pos, to - pos);
          separated = !blockSeparator;
        } else if (node.isLeaf) {
          if (leafText) {
            text += typeof leafText === "function" ? leafText(node) : leafText;
          } else if (node.type.spec.leafText) {
            text += node.type.spec.leafText(node);
          }
          separated = !blockSeparator;
        } else if (!separated && node.isBlock) {
          text += blockSeparator;
          separated = true;
        }
      }, 0);
      return text;
    }
    /**
    Create a new fragment containing the combined content of this
    fragment and the other.
    */
    append(other) {
      if (!other.size)
        return this;
      if (!this.size)
        return other;
      let last = this.lastChild, first2 = other.firstChild, content = this.content.slice(), i = 0;
      if (last.isText && last.sameMarkup(first2)) {
        content[content.length - 1] = last.withText(last.text + first2.text);
        i = 1;
      }
      for (; i < other.content.length; i++)
        content.push(other.content[i]);
      return new _Fragment(content, this.size + other.size);
    }
    /**
    Cut out the sub-fragment between the two given positions.
    */
    cut(from, to = this.size) {
      if (from == 0 && to == this.size)
        return this;
      let result = [], size = 0;
      if (to > from)
        for (let i = 0, pos = 0; pos < to; i++) {
          let child = this.content[i], end = pos + child.nodeSize;
          if (end > from) {
            if (pos < from || end > to) {
              if (child.isText)
                child = child.cut(Math.max(0, from - pos), Math.min(child.text.length, to - pos));
              else
                child = child.cut(Math.max(0, from - pos - 1), Math.min(child.content.size, to - pos - 1));
            }
            result.push(child);
            size += child.nodeSize;
          }
          pos = end;
        }
      return new _Fragment(result, size);
    }
    /**
    @internal
    */
    cutByIndex(from, to) {
      if (from == to)
        return _Fragment.empty;
      if (from == 0 && to == this.content.length)
        return this;
      return new _Fragment(this.content.slice(from, to));
    }
    /**
    Create a new fragment in which the node at the given index is
    replaced by the given node.
    */
    replaceChild(index, node) {
      let current = this.content[index];
      if (current == node)
        return this;
      let copy2 = this.content.slice();
      let size = this.size + node.nodeSize - current.nodeSize;
      copy2[index] = node;
      return new _Fragment(copy2, size);
    }
    /**
    Create a new fragment by prepending the given node to this
    fragment.
    */
    addToStart(node) {
      return new _Fragment([node].concat(this.content), this.size + node.nodeSize);
    }
    /**
    Create a new fragment by appending the given node to this
    fragment.
    */
    addToEnd(node) {
      return new _Fragment(this.content.concat(node), this.size + node.nodeSize);
    }
    /**
    Compare this fragment to another one.
    */
    eq(other) {
      if (this.content.length != other.content.length)
        return false;
      for (let i = 0; i < this.content.length; i++)
        if (!this.content[i].eq(other.content[i]))
          return false;
      return true;
    }
    /**
    The first child of the fragment, or `null` if it is empty.
    */
    get firstChild() {
      return this.content.length ? this.content[0] : null;
    }
    /**
    The last child of the fragment, or `null` if it is empty.
    */
    get lastChild() {
      return this.content.length ? this.content[this.content.length - 1] : null;
    }
    /**
    The number of child nodes in this fragment.
    */
    get childCount() {
      return this.content.length;
    }
    /**
    Get the child node at the given index. Raise an error when the
    index is out of range.
    */
    child(index) {
      let found2 = this.content[index];
      if (!found2)
        throw new RangeError("Index " + index + " out of range for " + this);
      return found2;
    }
    /**
    Get the child node at the given index, if it exists.
    */
    maybeChild(index) {
      return this.content[index] || null;
    }
    /**
    Call `f` for every child node, passing the node, its offset
    into this parent node, and its index.
    */
    forEach(f) {
      for (let i = 0, p = 0; i < this.content.length; i++) {
        let child = this.content[i];
        f(child, p, i);
        p += child.nodeSize;
      }
    }
    /**
    Find the first position at which this fragment and another
    fragment differ, or `null` if they are the same.
    */
    findDiffStart(other, pos = 0) {
      return findDiffStart(this, other, pos);
    }
    /**
    Find the first position, searching from the end, at which this
    fragment and the given fragment differ, or `null` if they are
    the same. Since this position will not be the same in both
    nodes, an object with two separate positions is returned.
    */
    findDiffEnd(other, pos = this.size, otherPos = other.size) {
      return findDiffEnd(this, other, pos, otherPos);
    }
    /**
    Find the index and inner offset corresponding to a given relative
    position in this fragment. The result object will be reused
    (overwritten) the next time the function is called. (Not public.)
    */
    findIndex(pos, round = -1) {
      if (pos == 0)
        return retIndex(0, pos);
      if (pos == this.size)
        return retIndex(this.content.length, pos);
      if (pos > this.size || pos < 0)
        throw new RangeError(`Position ${pos} outside of fragment (${this})`);
      for (let i = 0, curPos = 0; ; i++) {
        let cur = this.child(i), end = curPos + cur.nodeSize;
        if (end >= pos) {
          if (end == pos || round > 0)
            return retIndex(i + 1, end);
          return retIndex(i, curPos);
        }
        curPos = end;
      }
    }
    /**
    Return a debugging string that describes this fragment.
    */
    toString() {
      return "<" + this.toStringInner() + ">";
    }
    /**
    @internal
    */
    toStringInner() {
      return this.content.join(", ");
    }
    /**
    Create a JSON-serializeable representation of this fragment.
    */
    toJSON() {
      return this.content.length ? this.content.map((n) => n.toJSON()) : null;
    }
    /**
    Deserialize a fragment from its JSON representation.
    */
    static fromJSON(schema, value) {
      if (!value)
        return _Fragment.empty;
      if (!Array.isArray(value))
        throw new RangeError("Invalid input for Fragment.fromJSON");
      return new _Fragment(value.map(schema.nodeFromJSON));
    }
    /**
    Build a fragment from an array of nodes. Ensures that adjacent
    text nodes with the same marks are joined together.
    */
    static fromArray(array) {
      if (!array.length)
        return _Fragment.empty;
      let joined, size = 0;
      for (let i = 0; i < array.length; i++) {
        let node = array[i];
        size += node.nodeSize;
        if (i && node.isText && array[i - 1].sameMarkup(node)) {
          if (!joined)
            joined = array.slice(0, i);
          joined[joined.length - 1] = node.withText(joined[joined.length - 1].text + node.text);
        } else if (joined) {
          joined.push(node);
        }
      }
      return new _Fragment(joined || array, size);
    }
    /**
    Create a fragment from something that can be interpreted as a
    set of nodes. For `null`, it returns the empty fragment. For a
    fragment, the fragment itself. For a node or array of nodes, a
    fragment containing those nodes.
    */
    static from(nodes) {
      if (!nodes)
        return _Fragment.empty;
      if (nodes instanceof _Fragment)
        return nodes;
      if (Array.isArray(nodes))
        return this.fromArray(nodes);
      if (nodes.attrs)
        return new _Fragment([nodes], nodes.nodeSize);
      throw new RangeError("Can not convert " + nodes + " to a Fragment" + (nodes.nodesBetween ? " (looks like multiple versions of prosemirror-model were loaded)" : ""));
    }
  };
  Fragment.empty = new Fragment([], 0);
  var found = { index: 0, offset: 0 };
  function retIndex(index, offset) {
    found.index = index;
    found.offset = offset;
    return found;
  }
  function compareDeep(a, b) {
    if (a === b)
      return true;
    if (!(a && typeof a == "object") || !(b && typeof b == "object"))
      return false;
    let array = Array.isArray(a);
    if (Array.isArray(b) != array)
      return false;
    if (array) {
      if (a.length != b.length)
        return false;
      for (let i = 0; i < a.length; i++)
        if (!compareDeep(a[i], b[i]))
          return false;
    } else {
      for (let p in a)
        if (!(p in b) || !compareDeep(a[p], b[p]))
          return false;
      for (let p in b)
        if (!(p in a))
          return false;
    }
    return true;
  }
  var Mark = class _Mark {
    /**
    @internal
    */
    constructor(type, attrs) {
      this.type = type;
      this.attrs = attrs;
    }
    /**
    Given a set of marks, create a new set which contains this one as
    well, in the right position. If this mark is already in the set,
    the set itself is returned. If any marks that are set to be
    [exclusive](https://prosemirror.net/docs/ref/#model.MarkSpec.excludes) with this mark are present,
    those are replaced by this one.
    */
    addToSet(set) {
      let copy2, placed = false;
      for (let i = 0; i < set.length; i++) {
        let other = set[i];
        if (this.eq(other))
          return set;
        if (this.type.excludes(other.type)) {
          if (!copy2)
            copy2 = set.slice(0, i);
        } else if (other.type.excludes(this.type)) {
          return set;
        } else {
          if (!placed && other.type.rank > this.type.rank) {
            if (!copy2)
              copy2 = set.slice(0, i);
            copy2.push(this);
            placed = true;
          }
          if (copy2)
            copy2.push(other);
        }
      }
      if (!copy2)
        copy2 = set.slice();
      if (!placed)
        copy2.push(this);
      return copy2;
    }
    /**
    Remove this mark from the given set, returning a new set. If this
    mark is not in the set, the set itself is returned.
    */
    removeFromSet(set) {
      for (let i = 0; i < set.length; i++)
        if (this.eq(set[i]))
          return set.slice(0, i).concat(set.slice(i + 1));
      return set;
    }
    /**
    Test whether this mark is in the given set of marks.
    */
    isInSet(set) {
      for (let i = 0; i < set.length; i++)
        if (this.eq(set[i]))
          return true;
      return false;
    }
    /**
    Test whether this mark has the same type and attributes as
    another mark.
    */
    eq(other) {
      return this == other || this.type == other.type && compareDeep(this.attrs, other.attrs);
    }
    /**
    Convert this mark to a JSON-serializeable representation.
    */
    toJSON() {
      let obj = { type: this.type.name };
      for (let _ in this.attrs) {
        obj.attrs = this.attrs;
        break;
      }
      return obj;
    }
    /**
    Deserialize a mark from JSON.
    */
    static fromJSON(schema, json) {
      if (!json)
        throw new RangeError("Invalid input for Mark.fromJSON");
      let type = schema.marks[json.type];
      if (!type)
        throw new RangeError(`There is no mark type ${json.type} in this schema`);
      return type.create(json.attrs);
    }
    /**
    Test whether two sets of marks are identical.
    */
    static sameSet(a, b) {
      if (a == b)
        return true;
      if (a.length != b.length)
        return false;
      for (let i = 0; i < a.length; i++)
        if (!a[i].eq(b[i]))
          return false;
      return true;
    }
    /**
    Create a properly sorted mark set from null, a single mark, or an
    unsorted array of marks.
    */
    static setFrom(marks) {
      if (!marks || Array.isArray(marks) && marks.length == 0)
        return _Mark.none;
      if (marks instanceof _Mark)
        return [marks];
      let copy2 = marks.slice();
      copy2.sort((a, b) => a.type.rank - b.type.rank);
      return copy2;
    }
  };
  Mark.none = [];
  var ReplaceError = class extends Error {
  };
  var Slice = class _Slice {
    /**
    Create a slice. When specifying a non-zero open depth, you must
    make sure that there are nodes of at least that depth at the
    appropriate side of the fragment—i.e. if the fragment is an
    empty paragraph node, `openStart` and `openEnd` can't be greater
    than 1.
    
    It is not necessary for the content of open nodes to conform to
    the schema's content constraints, though it should be a valid
    start/end/middle for such a node, depending on which sides are
    open.
    */
    constructor(content, openStart, openEnd) {
      this.content = content;
      this.openStart = openStart;
      this.openEnd = openEnd;
    }
    /**
    The size this slice would add when inserted into a document.
    */
    get size() {
      return this.content.size - this.openStart - this.openEnd;
    }
    /**
    @internal
    */
    insertAt(pos, fragment) {
      let content = insertInto(this.content, pos + this.openStart, fragment);
      return content && new _Slice(content, this.openStart, this.openEnd);
    }
    /**
    @internal
    */
    removeBetween(from, to) {
      return new _Slice(removeRange(this.content, from + this.openStart, to + this.openStart), this.openStart, this.openEnd);
    }
    /**
    Tests whether this slice is equal to another slice.
    */
    eq(other) {
      return this.content.eq(other.content) && this.openStart == other.openStart && this.openEnd == other.openEnd;
    }
    /**
    @internal
    */
    toString() {
      return this.content + "(" + this.openStart + "," + this.openEnd + ")";
    }
    /**
    Convert a slice to a JSON-serializable representation.
    */
    toJSON() {
      if (!this.content.size)
        return null;
      let json = { content: this.content.toJSON() };
      if (this.openStart > 0)
        json.openStart = this.openStart;
      if (this.openEnd > 0)
        json.openEnd = this.openEnd;
      return json;
    }
    /**
    Deserialize a slice from its JSON representation.
    */
    static fromJSON(schema, json) {
      if (!json)
        return _Slice.empty;
      let openStart = json.openStart || 0, openEnd = json.openEnd || 0;
      if (typeof openStart != "number" || typeof openEnd != "number")
        throw new RangeError("Invalid input for Slice.fromJSON");
      return new _Slice(Fragment.fromJSON(schema, json.content), openStart, openEnd);
    }
    /**
    Create a slice from a fragment by taking the maximum possible
    open value on both side of the fragment.
    */
    static maxOpen(fragment, openIsolating = true) {
      let openStart = 0, openEnd = 0;
      for (let n = fragment.firstChild; n && !n.isLeaf && (openIsolating || !n.type.spec.isolating); n = n.firstChild)
        openStart++;
      for (let n = fragment.lastChild; n && !n.isLeaf && (openIsolating || !n.type.spec.isolating); n = n.lastChild)
        openEnd++;
      return new _Slice(fragment, openStart, openEnd);
    }
  };
  Slice.empty = new Slice(Fragment.empty, 0, 0);
  function removeRange(content, from, to) {
    let { index, offset } = content.findIndex(from), child = content.maybeChild(index);
    let { index: indexTo, offset: offsetTo } = content.findIndex(to);
    if (offset == from || child.isText) {
      if (offsetTo != to && !content.child(indexTo).isText)
        throw new RangeError("Removing non-flat range");
      return content.cut(0, from).append(content.cut(to));
    }
    if (index != indexTo)
      throw new RangeError("Removing non-flat range");
    return content.replaceChild(index, child.copy(removeRange(child.content, from - offset - 1, to - offset - 1)));
  }
  function insertInto(content, dist, insert, parent) {
    let { index, offset } = content.findIndex(dist), child = content.maybeChild(index);
    if (offset == dist || child.isText) {
      if (parent && !parent.canReplace(index, index, insert))
        return null;
      return content.cut(0, dist).append(insert).append(content.cut(dist));
    }
    let inner = insertInto(child.content, dist - offset - 1, insert);
    return inner && content.replaceChild(index, child.copy(inner));
  }
  function replace($from, $to, slice) {
    if (slice.openStart > $from.depth)
      throw new ReplaceError("Inserted content deeper than insertion position");
    if ($from.depth - slice.openStart != $to.depth - slice.openEnd)
      throw new ReplaceError("Inconsistent open depths");
    return replaceOuter($from, $to, slice, 0);
  }
  function replaceOuter($from, $to, slice, depth) {
    let index = $from.index(depth), node = $from.node(depth);
    if (index == $to.index(depth) && depth < $from.depth - slice.openStart) {
      let inner = replaceOuter($from, $to, slice, depth + 1);
      return node.copy(node.content.replaceChild(index, inner));
    } else if (!slice.content.size) {
      return close(node, replaceTwoWay($from, $to, depth));
    } else if (!slice.openStart && !slice.openEnd && $from.depth == depth && $to.depth == depth) {
      let parent = $from.parent, content = parent.content;
      return close(parent, content.cut(0, $from.parentOffset).append(slice.content).append(content.cut($to.parentOffset)));
    } else {
      let { start, end } = prepareSliceForReplace(slice, $from);
      return close(node, replaceThreeWay($from, start, end, $to, depth));
    }
  }
  function checkJoin(main, sub) {
    if (!sub.type.compatibleContent(main.type))
      throw new ReplaceError("Cannot join " + sub.type.name + " onto " + main.type.name);
  }
  function joinable($before, $after, depth) {
    let node = $before.node(depth);
    checkJoin(node, $after.node(depth));
    return node;
  }
  function addNode(child, target) {
    let last = target.length - 1;
    if (last >= 0 && child.isText && child.sameMarkup(target[last]))
      target[last] = child.withText(target[last].text + child.text);
    else
      target.push(child);
  }
  function addRange($start, $end, depth, target) {
    let node = ($end || $start).node(depth);
    let startIndex = 0, endIndex = $end ? $end.index(depth) : node.childCount;
    if ($start) {
      startIndex = $start.index(depth);
      if ($start.depth > depth) {
        startIndex++;
      } else if ($start.textOffset) {
        addNode($start.nodeAfter, target);
        startIndex++;
      }
    }
    for (let i = startIndex; i < endIndex; i++)
      addNode(node.child(i), target);
    if ($end && $end.depth == depth && $end.textOffset)
      addNode($end.nodeBefore, target);
  }
  function close(node, content) {
    node.type.checkContent(content);
    return node.copy(content);
  }
  function replaceThreeWay($from, $start, $end, $to, depth) {
    let openStart = $from.depth > depth && joinable($from, $start, depth + 1);
    let openEnd = $to.depth > depth && joinable($end, $to, depth + 1);
    let content = [];
    addRange(null, $from, depth, content);
    if (openStart && openEnd && $start.index(depth) == $end.index(depth)) {
      checkJoin(openStart, openEnd);
      addNode(close(openStart, replaceThreeWay($from, $start, $end, $to, depth + 1)), content);
    } else {
      if (openStart)
        addNode(close(openStart, replaceTwoWay($from, $start, depth + 1)), content);
      addRange($start, $end, depth, content);
      if (openEnd)
        addNode(close(openEnd, replaceTwoWay($end, $to, depth + 1)), content);
    }
    addRange($to, null, depth, content);
    return new Fragment(content);
  }
  function replaceTwoWay($from, $to, depth) {
    let content = [];
    addRange(null, $from, depth, content);
    if ($from.depth > depth) {
      let type = joinable($from, $to, depth + 1);
      addNode(close(type, replaceTwoWay($from, $to, depth + 1)), content);
    }
    addRange($to, null, depth, content);
    return new Fragment(content);
  }
  function prepareSliceForReplace(slice, $along) {
    let extra = $along.depth - slice.openStart, parent = $along.node(extra);
    let node = parent.copy(slice.content);
    for (let i = extra - 1; i >= 0; i--)
      node = $along.node(i).copy(Fragment.from(node));
    return {
      start: node.resolveNoCache(slice.openStart + extra),
      end: node.resolveNoCache(node.content.size - slice.openEnd - extra)
    };
  }
  var ResolvedPos = class _ResolvedPos {
    /**
    @internal
    */
    constructor(pos, path, parentOffset) {
      this.pos = pos;
      this.path = path;
      this.parentOffset = parentOffset;
      this.depth = path.length / 3 - 1;
    }
    /**
    @internal
    */
    resolveDepth(val) {
      if (val == null)
        return this.depth;
      if (val < 0)
        return this.depth + val;
      return val;
    }
    /**
    The parent node that the position points into. Note that even if
    a position points into a text node, that node is not considered
    the parent—text nodes are ‘flat’ in this model, and have no content.
    */
    get parent() {
      return this.node(this.depth);
    }
    /**
    The root node in which the position was resolved.
    */
    get doc() {
      return this.node(0);
    }
    /**
    The ancestor node at the given level. `p.node(p.depth)` is the
    same as `p.parent`.
    */
    node(depth) {
      return this.path[this.resolveDepth(depth) * 3];
    }
    /**
    The index into the ancestor at the given level. If this points
    at the 3rd node in the 2nd paragraph on the top level, for
    example, `p.index(0)` is 1 and `p.index(1)` is 2.
    */
    index(depth) {
      return this.path[this.resolveDepth(depth) * 3 + 1];
    }
    /**
    The index pointing after this position into the ancestor at the
    given level.
    */
    indexAfter(depth) {
      depth = this.resolveDepth(depth);
      return this.index(depth) + (depth == this.depth && !this.textOffset ? 0 : 1);
    }
    /**
    The (absolute) position at the start of the node at the given
    level.
    */
    start(depth) {
      depth = this.resolveDepth(depth);
      return depth == 0 ? 0 : this.path[depth * 3 - 1] + 1;
    }
    /**
    The (absolute) position at the end of the node at the given
    level.
    */
    end(depth) {
      depth = this.resolveDepth(depth);
      return this.start(depth) + this.node(depth).content.size;
    }
    /**
    The (absolute) position directly before the wrapping node at the
    given level, or, when `depth` is `this.depth + 1`, the original
    position.
    */
    before(depth) {
      depth = this.resolveDepth(depth);
      if (!depth)
        throw new RangeError("There is no position before the top-level node");
      return depth == this.depth + 1 ? this.pos : this.path[depth * 3 - 1];
    }
    /**
    The (absolute) position directly after the wrapping node at the
    given level, or the original position when `depth` is `this.depth + 1`.
    */
    after(depth) {
      depth = this.resolveDepth(depth);
      if (!depth)
        throw new RangeError("There is no position after the top-level node");
      return depth == this.depth + 1 ? this.pos : this.path[depth * 3 - 1] + this.path[depth * 3].nodeSize;
    }
    /**
    When this position points into a text node, this returns the
    distance between the position and the start of the text node.
    Will be zero for positions that point between nodes.
    */
    get textOffset() {
      return this.pos - this.path[this.path.length - 1];
    }
    /**
    Get the node directly after the position, if any. If the position
    points into a text node, only the part of that node after the
    position is returned.
    */
    get nodeAfter() {
      let parent = this.parent, index = this.index(this.depth);
      if (index == parent.childCount)
        return null;
      let dOff = this.pos - this.path[this.path.length - 1], child = parent.child(index);
      return dOff ? parent.child(index).cut(dOff) : child;
    }
    /**
    Get the node directly before the position, if any. If the
    position points into a text node, only the part of that node
    before the position is returned.
    */
    get nodeBefore() {
      let index = this.index(this.depth);
      let dOff = this.pos - this.path[this.path.length - 1];
      if (dOff)
        return this.parent.child(index).cut(0, dOff);
      return index == 0 ? null : this.parent.child(index - 1);
    }
    /**
    Get the position at the given index in the parent node at the
    given depth (which defaults to `this.depth`).
    */
    posAtIndex(index, depth) {
      depth = this.resolveDepth(depth);
      let node = this.path[depth * 3], pos = depth == 0 ? 0 : this.path[depth * 3 - 1] + 1;
      for (let i = 0; i < index; i++)
        pos += node.child(i).nodeSize;
      return pos;
    }
    /**
    Get the marks at this position, factoring in the surrounding
    marks' [`inclusive`](https://prosemirror.net/docs/ref/#model.MarkSpec.inclusive) property. If the
    position is at the start of a non-empty node, the marks of the
    node after it (if any) are returned.
    */
    marks() {
      let parent = this.parent, index = this.index();
      if (parent.content.size == 0)
        return Mark.none;
      if (this.textOffset)
        return parent.child(index).marks;
      let main = parent.maybeChild(index - 1), other = parent.maybeChild(index);
      if (!main) {
        let tmp = main;
        main = other;
        other = tmp;
      }
      let marks = main.marks;
      for (var i = 0; i < marks.length; i++)
        if (marks[i].type.spec.inclusive === false && (!other || !marks[i].isInSet(other.marks)))
          marks = marks[i--].removeFromSet(marks);
      return marks;
    }
    /**
    Get the marks after the current position, if any, except those
    that are non-inclusive and not present at position `$end`. This
    is mostly useful for getting the set of marks to preserve after a
    deletion. Will return `null` if this position is at the end of
    its parent node or its parent node isn't a textblock (in which
    case no marks should be preserved).
    */
    marksAcross($end) {
      let after = this.parent.maybeChild(this.index());
      if (!after || !after.isInline)
        return null;
      let marks = after.marks, next = $end.parent.maybeChild($end.index());
      for (var i = 0; i < marks.length; i++)
        if (marks[i].type.spec.inclusive === false && (!next || !marks[i].isInSet(next.marks)))
          marks = marks[i--].removeFromSet(marks);
      return marks;
    }
    /**
    The depth up to which this position and the given (non-resolved)
    position share the same parent nodes.
    */
    sharedDepth(pos) {
      for (let depth = this.depth; depth > 0; depth--)
        if (this.start(depth) <= pos && this.end(depth) >= pos)
          return depth;
      return 0;
    }
    /**
    Returns a range based on the place where this position and the
    given position diverge around block content. If both point into
    the same textblock, for example, a range around that textblock
    will be returned. If they point into different blocks, the range
    around those blocks in their shared ancestor is returned. You can
    pass in an optional predicate that will be called with a parent
    node to see if a range into that parent is acceptable.
    */
    blockRange(other = this, pred) {
      if (other.pos < this.pos)
        return other.blockRange(this);
      for (let d = this.depth - (this.parent.inlineContent || this.pos == other.pos ? 1 : 0); d >= 0; d--)
        if (other.pos <= this.end(d) && (!pred || pred(this.node(d))))
          return new NodeRange(this, other, d);
      return null;
    }
    /**
    Query whether the given position shares the same parent node.
    */
    sameParent(other) {
      return this.pos - this.parentOffset == other.pos - other.parentOffset;
    }
    /**
    Return the greater of this and the given position.
    */
    max(other) {
      return other.pos > this.pos ? other : this;
    }
    /**
    Return the smaller of this and the given position.
    */
    min(other) {
      return other.pos < this.pos ? other : this;
    }
    /**
    @internal
    */
    toString() {
      let str = "";
      for (let i = 1; i <= this.depth; i++)
        str += (str ? "/" : "") + this.node(i).type.name + "_" + this.index(i - 1);
      return str + ":" + this.parentOffset;
    }
    /**
    @internal
    */
    static resolve(doc, pos) {
      if (!(pos >= 0 && pos <= doc.content.size))
        throw new RangeError("Position " + pos + " out of range");
      let path = [];
      let start = 0, parentOffset = pos;
      for (let node = doc; ; ) {
        let { index, offset } = node.content.findIndex(parentOffset);
        let rem = parentOffset - offset;
        path.push(node, index, start + offset);
        if (!rem)
          break;
        node = node.child(index);
        if (node.isText)
          break;
        parentOffset = rem - 1;
        start += offset + 1;
      }
      return new _ResolvedPos(pos, path, parentOffset);
    }
    /**
    @internal
    */
    static resolveCached(doc, pos) {
      for (let i = 0; i < resolveCache.length; i++) {
        let cached = resolveCache[i];
        if (cached.pos == pos && cached.doc == doc)
          return cached;
      }
      let result = resolveCache[resolveCachePos] = _ResolvedPos.resolve(doc, pos);
      resolveCachePos = (resolveCachePos + 1) % resolveCacheSize;
      return result;
    }
  };
  var resolveCache = [];
  var resolveCachePos = 0;
  var resolveCacheSize = 12;
  var NodeRange = class {
    /**
    Construct a node range. `$from` and `$to` should point into the
    same node until at least the given `depth`, since a node range
    denotes an adjacent set of nodes in a single parent node.
    */
    constructor($from, $to, depth) {
      this.$from = $from;
      this.$to = $to;
      this.depth = depth;
    }
    /**
    The position at the start of the range.
    */
    get start() {
      return this.$from.before(this.depth + 1);
    }
    /**
    The position at the end of the range.
    */
    get end() {
      return this.$to.after(this.depth + 1);
    }
    /**
    The parent node that the range points into.
    */
    get parent() {
      return this.$from.node(this.depth);
    }
    /**
    The start index of the range in the parent node.
    */
    get startIndex() {
      return this.$from.index(this.depth);
    }
    /**
    The end index of the range in the parent node.
    */
    get endIndex() {
      return this.$to.indexAfter(this.depth);
    }
  };
  var emptyAttrs = /* @__PURE__ */ Object.create(null);
  var Node = class _Node {
    /**
    @internal
    */
    constructor(type, attrs, content, marks = Mark.none) {
      this.type = type;
      this.attrs = attrs;
      this.marks = marks;
      this.content = content || Fragment.empty;
    }
    /**
    The size of this node, as defined by the integer-based [indexing
    scheme](/docs/guide/#doc.indexing). For text nodes, this is the
    amount of characters. For other leaf nodes, it is one. For
    non-leaf nodes, it is the size of the content plus two (the
    start and end token).
    */
    get nodeSize() {
      return this.isLeaf ? 1 : 2 + this.content.size;
    }
    /**
    The number of children that the node has.
    */
    get childCount() {
      return this.content.childCount;
    }
    /**
    Get the child node at the given index. Raises an error when the
    index is out of range.
    */
    child(index) {
      return this.content.child(index);
    }
    /**
    Get the child node at the given index, if it exists.
    */
    maybeChild(index) {
      return this.content.maybeChild(index);
    }
    /**
    Call `f` for every child node, passing the node, its offset
    into this parent node, and its index.
    */
    forEach(f) {
      this.content.forEach(f);
    }
    /**
    Invoke a callback for all descendant nodes recursively between
    the given two positions that are relative to start of this
    node's content. The callback is invoked with the node, its
    position relative to the original node (method receiver),
    its parent node, and its child index. When the callback returns
    false for a given node, that node's children will not be
    recursed over. The last parameter can be used to specify a
    starting position to count from.
    */
    nodesBetween(from, to, f, startPos = 0) {
      this.content.nodesBetween(from, to, f, startPos, this);
    }
    /**
    Call the given callback for every descendant node. Doesn't
    descend into a node when the callback returns `false`.
    */
    descendants(f) {
      this.nodesBetween(0, this.content.size, f);
    }
    /**
    Concatenates all the text nodes found in this fragment and its
    children.
    */
    get textContent() {
      return this.isLeaf && this.type.spec.leafText ? this.type.spec.leafText(this) : this.textBetween(0, this.content.size, "");
    }
    /**
    Get all text between positions `from` and `to`. When
    `blockSeparator` is given, it will be inserted to separate text
    from different block nodes. If `leafText` is given, it'll be
    inserted for every non-text leaf node encountered, otherwise
    [`leafText`](https://prosemirror.net/docs/ref/#model.NodeSpec^leafText) will be used.
    */
    textBetween(from, to, blockSeparator, leafText) {
      return this.content.textBetween(from, to, blockSeparator, leafText);
    }
    /**
    Returns this node's first child, or `null` if there are no
    children.
    */
    get firstChild() {
      return this.content.firstChild;
    }
    /**
    Returns this node's last child, or `null` if there are no
    children.
    */
    get lastChild() {
      return this.content.lastChild;
    }
    /**
    Test whether two nodes represent the same piece of document.
    */
    eq(other) {
      return this == other || this.sameMarkup(other) && this.content.eq(other.content);
    }
    /**
    Compare the markup (type, attributes, and marks) of this node to
    those of another. Returns `true` if both have the same markup.
    */
    sameMarkup(other) {
      return this.hasMarkup(other.type, other.attrs, other.marks);
    }
    /**
    Check whether this node's markup correspond to the given type,
    attributes, and marks.
    */
    hasMarkup(type, attrs, marks) {
      return this.type == type && compareDeep(this.attrs, attrs || type.defaultAttrs || emptyAttrs) && Mark.sameSet(this.marks, marks || Mark.none);
    }
    /**
    Create a new node with the same markup as this node, containing
    the given content (or empty, if no content is given).
    */
    copy(content = null) {
      if (content == this.content)
        return this;
      return new _Node(this.type, this.attrs, content, this.marks);
    }
    /**
    Create a copy of this node, with the given set of marks instead
    of the node's own marks.
    */
    mark(marks) {
      return marks == this.marks ? this : new _Node(this.type, this.attrs, this.content, marks);
    }
    /**
    Create a copy of this node with only the content between the
    given positions. If `to` is not given, it defaults to the end of
    the node.
    */
    cut(from, to = this.content.size) {
      if (from == 0 && to == this.content.size)
        return this;
      return this.copy(this.content.cut(from, to));
    }
    /**
    Cut out the part of the document between the given positions, and
    return it as a `Slice` object.
    */
    slice(from, to = this.content.size, includeParents = false) {
      if (from == to)
        return Slice.empty;
      let $from = this.resolve(from), $to = this.resolve(to);
      let depth = includeParents ? 0 : $from.sharedDepth(to);
      let start = $from.start(depth), node = $from.node(depth);
      let content = node.content.cut($from.pos - start, $to.pos - start);
      return new Slice(content, $from.depth - depth, $to.depth - depth);
    }
    /**
    Replace the part of the document between the given positions with
    the given slice. The slice must 'fit', meaning its open sides
    must be able to connect to the surrounding content, and its
    content nodes must be valid children for the node they are placed
    into. If any of this is violated, an error of type
    [`ReplaceError`](https://prosemirror.net/docs/ref/#model.ReplaceError) is thrown.
    */
    replace(from, to, slice) {
      return replace(this.resolve(from), this.resolve(to), slice);
    }
    /**
    Find the node directly after the given position.
    */
    nodeAt(pos) {
      for (let node = this; ; ) {
        let { index, offset } = node.content.findIndex(pos);
        node = node.maybeChild(index);
        if (!node)
          return null;
        if (offset == pos || node.isText)
          return node;
        pos -= offset + 1;
      }
    }
    /**
    Find the (direct) child node after the given offset, if any,
    and return it along with its index and offset relative to this
    node.
    */
    childAfter(pos) {
      let { index, offset } = this.content.findIndex(pos);
      return { node: this.content.maybeChild(index), index, offset };
    }
    /**
    Find the (direct) child node before the given offset, if any,
    and return it along with its index and offset relative to this
    node.
    */
    childBefore(pos) {
      if (pos == 0)
        return { node: null, index: 0, offset: 0 };
      let { index, offset } = this.content.findIndex(pos);
      if (offset < pos)
        return { node: this.content.child(index), index, offset };
      let node = this.content.child(index - 1);
      return { node, index: index - 1, offset: offset - node.nodeSize };
    }
    /**
    Resolve the given position in the document, returning an
    [object](https://prosemirror.net/docs/ref/#model.ResolvedPos) with information about its context.
    */
    resolve(pos) {
      return ResolvedPos.resolveCached(this, pos);
    }
    /**
    @internal
    */
    resolveNoCache(pos) {
      return ResolvedPos.resolve(this, pos);
    }
    /**
    Test whether a given mark or mark type occurs in this document
    between the two given positions.
    */
    rangeHasMark(from, to, type) {
      let found2 = false;
      if (to > from)
        this.nodesBetween(from, to, (node) => {
          if (type.isInSet(node.marks))
            found2 = true;
          return !found2;
        });
      return found2;
    }
    /**
    True when this is a block (non-inline node)
    */
    get isBlock() {
      return this.type.isBlock;
    }
    /**
    True when this is a textblock node, a block node with inline
    content.
    */
    get isTextblock() {
      return this.type.isTextblock;
    }
    /**
    True when this node allows inline content.
    */
    get inlineContent() {
      return this.type.inlineContent;
    }
    /**
    True when this is an inline node (a text node or a node that can
    appear among text).
    */
    get isInline() {
      return this.type.isInline;
    }
    /**
    True when this is a text node.
    */
    get isText() {
      return this.type.isText;
    }
    /**
    True when this is a leaf node.
    */
    get isLeaf() {
      return this.type.isLeaf;
    }
    /**
    True when this is an atom, i.e. when it does not have directly
    editable content. This is usually the same as `isLeaf`, but can
    be configured with the [`atom` property](https://prosemirror.net/docs/ref/#model.NodeSpec.atom)
    on a node's spec (typically used when the node is displayed as
    an uneditable [node view](https://prosemirror.net/docs/ref/#view.NodeView)).
    */
    get isAtom() {
      return this.type.isAtom;
    }
    /**
    Return a string representation of this node for debugging
    purposes.
    */
    toString() {
      if (this.type.spec.toDebugString)
        return this.type.spec.toDebugString(this);
      let name = this.type.name;
      if (this.content.size)
        name += "(" + this.content.toStringInner() + ")";
      return wrapMarks(this.marks, name);
    }
    /**
    Get the content match in this node at the given index.
    */
    contentMatchAt(index) {
      let match = this.type.contentMatch.matchFragment(this.content, 0, index);
      if (!match)
        throw new Error("Called contentMatchAt on a node with invalid content");
      return match;
    }
    /**
    Test whether replacing the range between `from` and `to` (by
    child index) with the given replacement fragment (which defaults
    to the empty fragment) would leave the node's content valid. You
    can optionally pass `start` and `end` indices into the
    replacement fragment.
    */
    canReplace(from, to, replacement = Fragment.empty, start = 0, end = replacement.childCount) {
      let one = this.contentMatchAt(from).matchFragment(replacement, start, end);
      let two = one && one.matchFragment(this.content, to);
      if (!two || !two.validEnd)
        return false;
      for (let i = start; i < end; i++)
        if (!this.type.allowsMarks(replacement.child(i).marks))
          return false;
      return true;
    }
    /**
    Test whether replacing the range `from` to `to` (by index) with
    a node of the given type would leave the node's content valid.
    */
    canReplaceWith(from, to, type, marks) {
      if (marks && !this.type.allowsMarks(marks))
        return false;
      let start = this.contentMatchAt(from).matchType(type);
      let end = start && start.matchFragment(this.content, to);
      return end ? end.validEnd : false;
    }
    /**
    Test whether the given node's content could be appended to this
    node. If that node is empty, this will only return true if there
    is at least one node type that can appear in both nodes (to avoid
    merging completely incompatible nodes).
    */
    canAppend(other) {
      if (other.content.size)
        return this.canReplace(this.childCount, this.childCount, other.content);
      else
        return this.type.compatibleContent(other.type);
    }
    /**
    Check whether this node and its descendants conform to the
    schema, and raise error when they do not.
    */
    check() {
      this.type.checkContent(this.content);
      let copy2 = Mark.none;
      for (let i = 0; i < this.marks.length; i++)
        copy2 = this.marks[i].addToSet(copy2);
      if (!Mark.sameSet(copy2, this.marks))
        throw new RangeError(`Invalid collection of marks for node ${this.type.name}: ${this.marks.map((m) => m.type.name)}`);
      this.content.forEach((node) => node.check());
    }
    /**
    Return a JSON-serializeable representation of this node.
    */
    toJSON() {
      let obj = { type: this.type.name };
      for (let _ in this.attrs) {
        obj.attrs = this.attrs;
        break;
      }
      if (this.content.size)
        obj.content = this.content.toJSON();
      if (this.marks.length)
        obj.marks = this.marks.map((n) => n.toJSON());
      return obj;
    }
    /**
    Deserialize a node from its JSON representation.
    */
    static fromJSON(schema, json) {
      if (!json)
        throw new RangeError("Invalid input for Node.fromJSON");
      let marks = null;
      if (json.marks) {
        if (!Array.isArray(json.marks))
          throw new RangeError("Invalid mark data for Node.fromJSON");
        marks = json.marks.map(schema.markFromJSON);
      }
      if (json.type == "text") {
        if (typeof json.text != "string")
          throw new RangeError("Invalid text node in JSON");
        return schema.text(json.text, marks);
      }
      let content = Fragment.fromJSON(schema, json.content);
      return schema.nodeType(json.type).create(json.attrs, content, marks);
    }
  };
  Node.prototype.text = void 0;
  function wrapMarks(marks, str) {
    for (let i = marks.length - 1; i >= 0; i--)
      str = marks[i].type.name + "(" + str + ")";
    return str;
  }
  var ContentMatch = class _ContentMatch {
    /**
    @internal
    */
    constructor(validEnd) {
      this.validEnd = validEnd;
      this.next = [];
      this.wrapCache = [];
    }
    /**
    @internal
    */
    static parse(string, nodeTypes) {
      let stream = new TokenStream(string, nodeTypes);
      if (stream.next == null)
        return _ContentMatch.empty;
      let expr = parseExpr(stream);
      if (stream.next)
        stream.err("Unexpected trailing text");
      let match = dfa(nfa(expr));
      checkForDeadEnds(match, stream);
      return match;
    }
    /**
    Match a node type, returning a match after that node if
    successful.
    */
    matchType(type) {
      for (let i = 0; i < this.next.length; i++)
        if (this.next[i].type == type)
          return this.next[i].next;
      return null;
    }
    /**
    Try to match a fragment. Returns the resulting match when
    successful.
    */
    matchFragment(frag, start = 0, end = frag.childCount) {
      let cur = this;
      for (let i = start; cur && i < end; i++)
        cur = cur.matchType(frag.child(i).type);
      return cur;
    }
    /**
    @internal
    */
    get inlineContent() {
      return this.next.length != 0 && this.next[0].type.isInline;
    }
    /**
    Get the first matching node type at this match position that can
    be generated.
    */
    get defaultType() {
      for (let i = 0; i < this.next.length; i++) {
        let { type } = this.next[i];
        if (!(type.isText || type.hasRequiredAttrs()))
          return type;
      }
      return null;
    }
    /**
    @internal
    */
    compatible(other) {
      for (let i = 0; i < this.next.length; i++)
        for (let j = 0; j < other.next.length; j++)
          if (this.next[i].type == other.next[j].type)
            return true;
      return false;
    }
    /**
    Try to match the given fragment, and if that fails, see if it can
    be made to match by inserting nodes in front of it. When
    successful, return a fragment of inserted nodes (which may be
    empty if nothing had to be inserted). When `toEnd` is true, only
    return a fragment if the resulting match goes to the end of the
    content expression.
    */
    fillBefore(after, toEnd = false, startIndex = 0) {
      let seen = [this];
      function search(match, types) {
        let finished = match.matchFragment(after, startIndex);
        if (finished && (!toEnd || finished.validEnd))
          return Fragment.from(types.map((tp) => tp.createAndFill()));
        for (let i = 0; i < match.next.length; i++) {
          let { type, next } = match.next[i];
          if (!(type.isText || type.hasRequiredAttrs()) && seen.indexOf(next) == -1) {
            seen.push(next);
            let found2 = search(next, types.concat(type));
            if (found2)
              return found2;
          }
        }
        return null;
      }
      return search(this, []);
    }
    /**
    Find a set of wrapping node types that would allow a node of the
    given type to appear at this position. The result may be empty
    (when it fits directly) and will be null when no such wrapping
    exists.
    */
    findWrapping(target) {
      for (let i = 0; i < this.wrapCache.length; i += 2)
        if (this.wrapCache[i] == target)
          return this.wrapCache[i + 1];
      let computed = this.computeWrapping(target);
      this.wrapCache.push(target, computed);
      return computed;
    }
    /**
    @internal
    */
    computeWrapping(target) {
      let seen = /* @__PURE__ */ Object.create(null), active = [{ match: this, type: null, via: null }];
      while (active.length) {
        let current = active.shift(), match = current.match;
        if (match.matchType(target)) {
          let result = [];
          for (let obj = current; obj.type; obj = obj.via)
            result.push(obj.type);
          return result.reverse();
        }
        for (let i = 0; i < match.next.length; i++) {
          let { type, next } = match.next[i];
          if (!type.isLeaf && !type.hasRequiredAttrs() && !(type.name in seen) && (!current.type || next.validEnd)) {
            active.push({ match: type.contentMatch, type, via: current });
            seen[type.name] = true;
          }
        }
      }
      return null;
    }
    /**
    The number of outgoing edges this node has in the finite
    automaton that describes the content expression.
    */
    get edgeCount() {
      return this.next.length;
    }
    /**
    Get the _n_​th outgoing edge from this node in the finite
    automaton that describes the content expression.
    */
    edge(n) {
      if (n >= this.next.length)
        throw new RangeError(`There's no ${n}th edge in this content match`);
      return this.next[n];
    }
    /**
    @internal
    */
    toString() {
      let seen = [];
      function scan(m) {
        seen.push(m);
        for (let i = 0; i < m.next.length; i++)
          if (seen.indexOf(m.next[i].next) == -1)
            scan(m.next[i].next);
      }
      scan(this);
      return seen.map((m, i) => {
        let out = i + (m.validEnd ? "*" : " ") + " ";
        for (let i2 = 0; i2 < m.next.length; i2++)
          out += (i2 ? ", " : "") + m.next[i2].type.name + "->" + seen.indexOf(m.next[i2].next);
        return out;
      }).join("\n");
    }
  };
  ContentMatch.empty = new ContentMatch(true);
  var TokenStream = class {
    constructor(string, nodeTypes) {
      this.string = string;
      this.nodeTypes = nodeTypes;
      this.inline = null;
      this.pos = 0;
      this.tokens = string.split(/\s*(?=\b|\W|$)/);
      if (this.tokens[this.tokens.length - 1] == "")
        this.tokens.pop();
      if (this.tokens[0] == "")
        this.tokens.shift();
    }
    get next() {
      return this.tokens[this.pos];
    }
    eat(tok) {
      return this.next == tok && (this.pos++ || true);
    }
    err(str) {
      throw new SyntaxError(str + " (in content expression '" + this.string + "')");
    }
  };
  function parseExpr(stream) {
    let exprs = [];
    do {
      exprs.push(parseExprSeq(stream));
    } while (stream.eat("|"));
    return exprs.length == 1 ? exprs[0] : { type: "choice", exprs };
  }
  function parseExprSeq(stream) {
    let exprs = [];
    do {
      exprs.push(parseExprSubscript(stream));
    } while (stream.next && stream.next != ")" && stream.next != "|");
    return exprs.length == 1 ? exprs[0] : { type: "seq", exprs };
  }
  function parseExprSubscript(stream) {
    let expr = parseExprAtom(stream);
    for (; ; ) {
      if (stream.eat("+"))
        expr = { type: "plus", expr };
      else if (stream.eat("*"))
        expr = { type: "star", expr };
      else if (stream.eat("?"))
        expr = { type: "opt", expr };
      else if (stream.eat("{"))
        expr = parseExprRange(stream, expr);
      else
        break;
    }
    return expr;
  }
  function parseNum(stream) {
    if (/\D/.test(stream.next))
      stream.err("Expected number, got '" + stream.next + "'");
    let result = Number(stream.next);
    stream.pos++;
    return result;
  }
  function parseExprRange(stream, expr) {
    let min = parseNum(stream), max = min;
    if (stream.eat(",")) {
      if (stream.next != "}")
        max = parseNum(stream);
      else
        max = -1;
    }
    if (!stream.eat("}"))
      stream.err("Unclosed braced range");
    return { type: "range", min, max, expr };
  }
  function resolveName(stream, name) {
    let types = stream.nodeTypes, type = types[name];
    if (type)
      return [type];
    let result = [];
    for (let typeName in types) {
      let type2 = types[typeName];
      if (type2.groups.indexOf(name) > -1)
        result.push(type2);
    }
    if (result.length == 0)
      stream.err("No node type or group '" + name + "' found");
    return result;
  }
  function parseExprAtom(stream) {
    if (stream.eat("(")) {
      let expr = parseExpr(stream);
      if (!stream.eat(")"))
        stream.err("Missing closing paren");
      return expr;
    } else if (!/\W/.test(stream.next)) {
      let exprs = resolveName(stream, stream.next).map((type) => {
        if (stream.inline == null)
          stream.inline = type.isInline;
        else if (stream.inline != type.isInline)
          stream.err("Mixing inline and block content");
        return { type: "name", value: type };
      });
      stream.pos++;
      return exprs.length == 1 ? exprs[0] : { type: "choice", exprs };
    } else {
      stream.err("Unexpected token '" + stream.next + "'");
    }
  }
  function nfa(expr) {
    let nfa2 = [[]];
    connect(compile(expr, 0), node());
    return nfa2;
    function node() {
      return nfa2.push([]) - 1;
    }
    function edge(from, to, term) {
      let edge2 = { term, to };
      nfa2[from].push(edge2);
      return edge2;
    }
    function connect(edges, to) {
      edges.forEach((edge2) => edge2.to = to);
    }
    function compile(expr2, from) {
      if (expr2.type == "choice") {
        return expr2.exprs.reduce((out, expr3) => out.concat(compile(expr3, from)), []);
      } else if (expr2.type == "seq") {
        for (let i = 0; ; i++) {
          let next = compile(expr2.exprs[i], from);
          if (i == expr2.exprs.length - 1)
            return next;
          connect(next, from = node());
        }
      } else if (expr2.type == "star") {
        let loop = node();
        edge(from, loop);
        connect(compile(expr2.expr, loop), loop);
        return [edge(loop)];
      } else if (expr2.type == "plus") {
        let loop = node();
        connect(compile(expr2.expr, from), loop);
        connect(compile(expr2.expr, loop), loop);
        return [edge(loop)];
      } else if (expr2.type == "opt") {
        return [edge(from)].concat(compile(expr2.expr, from));
      } else if (expr2.type == "range") {
        let cur = from;
        for (let i = 0; i < expr2.min; i++) {
          let next = node();
          connect(compile(expr2.expr, cur), next);
          cur = next;
        }
        if (expr2.max == -1) {
          connect(compile(expr2.expr, cur), cur);
        } else {
          for (let i = expr2.min; i < expr2.max; i++) {
            let next = node();
            edge(cur, next);
            connect(compile(expr2.expr, cur), next);
            cur = next;
          }
        }
        return [edge(cur)];
      } else if (expr2.type == "name") {
        return [edge(from, void 0, expr2.value)];
      } else {
        throw new Error("Unknown expr type");
      }
    }
  }
  function cmp(a, b) {
    return b - a;
  }
  function nullFrom(nfa2, node) {
    let result = [];
    scan(node);
    return result.sort(cmp);
    function scan(node2) {
      let edges = nfa2[node2];
      if (edges.length == 1 && !edges[0].term)
        return scan(edges[0].to);
      result.push(node2);
      for (let i = 0; i < edges.length; i++) {
        let { term, to } = edges[i];
        if (!term && result.indexOf(to) == -1)
          scan(to);
      }
    }
  }
  function dfa(nfa2) {
    let labeled = /* @__PURE__ */ Object.create(null);
    return explore(nullFrom(nfa2, 0));
    function explore(states) {
      let out = [];
      states.forEach((node) => {
        nfa2[node].forEach(({ term, to }) => {
          if (!term)
            return;
          let set;
          for (let i = 0; i < out.length; i++)
            if (out[i][0] == term)
              set = out[i][1];
          nullFrom(nfa2, to).forEach((node2) => {
            if (!set)
              out.push([term, set = []]);
            if (set.indexOf(node2) == -1)
              set.push(node2);
          });
        });
      });
      let state = labeled[states.join(",")] = new ContentMatch(states.indexOf(nfa2.length - 1) > -1);
      for (let i = 0; i < out.length; i++) {
        let states2 = out[i][1].sort(cmp);
        state.next.push({ type: out[i][0], next: labeled[states2.join(",")] || explore(states2) });
      }
      return state;
    }
  }
  function checkForDeadEnds(match, stream) {
    for (let i = 0, work = [match]; i < work.length; i++) {
      let state = work[i], dead = !state.validEnd, nodes = [];
      for (let j = 0; j < state.next.length; j++) {
        let { type, next } = state.next[j];
        nodes.push(type.name);
        if (dead && !(type.isText || type.hasRequiredAttrs()))
          dead = false;
        if (work.indexOf(next) == -1)
          work.push(next);
      }
      if (dead)
        stream.err("Only non-generatable nodes (" + nodes.join(", ") + ") in a required position (see https://prosemirror.net/docs/guide/#generatable)");
    }
  }
  function defaultAttrs(attrs) {
    let defaults2 = /* @__PURE__ */ Object.create(null);
    for (let attrName in attrs) {
      let attr = attrs[attrName];
      if (!attr.hasDefault)
        return null;
      defaults2[attrName] = attr.default;
    }
    return defaults2;
  }
  function computeAttrs(attrs, value) {
    let built = /* @__PURE__ */ Object.create(null);
    for (let name in attrs) {
      let given = value && value[name];
      if (given === void 0) {
        let attr = attrs[name];
        if (attr.hasDefault)
          given = attr.default;
        else
          throw new RangeError("No value supplied for attribute " + name);
      }
      built[name] = given;
    }
    return built;
  }
  function initAttrs(attrs) {
    let result = /* @__PURE__ */ Object.create(null);
    if (attrs)
      for (let name in attrs)
        result[name] = new Attribute(attrs[name]);
    return result;
  }
  var Attribute = class {
    constructor(options) {
      this.hasDefault = Object.prototype.hasOwnProperty.call(options, "default");
      this.default = options.default;
    }
    get isRequired() {
      return !this.hasDefault;
    }
  };
  var MarkType = class _MarkType {
    /**
    @internal
    */
    constructor(name, rank, schema, spec) {
      this.name = name;
      this.rank = rank;
      this.schema = schema;
      this.spec = spec;
      this.attrs = initAttrs(spec.attrs);
      this.excluded = null;
      let defaults2 = defaultAttrs(this.attrs);
      this.instance = defaults2 ? new Mark(this, defaults2) : null;
    }
    /**
    Create a mark of this type. `attrs` may be `null` or an object
    containing only some of the mark's attributes. The others, if
    they have defaults, will be added.
    */
    create(attrs = null) {
      if (!attrs && this.instance)
        return this.instance;
      return new Mark(this, computeAttrs(this.attrs, attrs));
    }
    /**
    @internal
    */
    static compile(marks, schema) {
      let result = /* @__PURE__ */ Object.create(null), rank = 0;
      marks.forEach((name, spec) => result[name] = new _MarkType(name, rank++, schema, spec));
      return result;
    }
    /**
    When there is a mark of this type in the given set, a new set
    without it is returned. Otherwise, the input set is returned.
    */
    removeFromSet(set) {
      for (var i = 0; i < set.length; i++)
        if (set[i].type == this) {
          set = set.slice(0, i).concat(set.slice(i + 1));
          i--;
        }
      return set;
    }
    /**
    Tests whether there is a mark of this type in the given set.
    */
    isInSet(set) {
      for (let i = 0; i < set.length; i++)
        if (set[i].type == this)
          return set[i];
    }
    /**
    Queries whether a given mark type is
    [excluded](https://prosemirror.net/docs/ref/#model.MarkSpec.excludes) by this one.
    */
    excludes(other) {
      return this.excluded.indexOf(other) > -1;
    }
  };
  var DOMParser = class _DOMParser {
    /**
    Create a parser that targets the given schema, using the given
    parsing rules.
    */
    constructor(schema, rules) {
      this.schema = schema;
      this.rules = rules;
      this.tags = [];
      this.styles = [];
      rules.forEach((rule) => {
        if (rule.tag)
          this.tags.push(rule);
        else if (rule.style)
          this.styles.push(rule);
      });
      this.normalizeLists = !this.tags.some((r) => {
        if (!/^(ul|ol)\b/.test(r.tag) || !r.node)
          return false;
        let node = schema.nodes[r.node];
        return node.contentMatch.matchType(node);
      });
    }
    /**
    Parse a document from the content of a DOM node.
    */
    parse(dom, options = {}) {
      let context = new ParseContext(this, options, false);
      context.addAll(dom, options.from, options.to);
      return context.finish();
    }
    /**
    Parses the content of the given DOM node, like
    [`parse`](https://prosemirror.net/docs/ref/#model.DOMParser.parse), and takes the same set of
    options. But unlike that method, which produces a whole node,
    this one returns a slice that is open at the sides, meaning that
    the schema constraints aren't applied to the start of nodes to
    the left of the input and the end of nodes at the end.
    */
    parseSlice(dom, options = {}) {
      let context = new ParseContext(this, options, true);
      context.addAll(dom, options.from, options.to);
      return Slice.maxOpen(context.finish());
    }
    /**
    @internal
    */
    matchTag(dom, context, after) {
      for (let i = after ? this.tags.indexOf(after) + 1 : 0; i < this.tags.length; i++) {
        let rule = this.tags[i];
        if (matches(dom, rule.tag) && (rule.namespace === void 0 || dom.namespaceURI == rule.namespace) && (!rule.context || context.matchesContext(rule.context))) {
          if (rule.getAttrs) {
            let result = rule.getAttrs(dom);
            if (result === false)
              continue;
            rule.attrs = result || void 0;
          }
          return rule;
        }
      }
    }
    /**
    @internal
    */
    matchStyle(prop, value, context, after) {
      for (let i = after ? this.styles.indexOf(after) + 1 : 0; i < this.styles.length; i++) {
        let rule = this.styles[i], style = rule.style;
        if (style.indexOf(prop) != 0 || rule.context && !context.matchesContext(rule.context) || // Test that the style string either precisely matches the prop,
        // or has an '=' sign after the prop, followed by the given
        // value.
        style.length > prop.length && (style.charCodeAt(prop.length) != 61 || style.slice(prop.length + 1) != value))
          continue;
        if (rule.getAttrs) {
          let result = rule.getAttrs(value);
          if (result === false)
            continue;
          rule.attrs = result || void 0;
        }
        return rule;
      }
    }
    /**
    @internal
    */
    static schemaRules(schema) {
      let result = [];
      function insert(rule) {
        let priority = rule.priority == null ? 50 : rule.priority, i = 0;
        for (; i < result.length; i++) {
          let next = result[i], nextPriority = next.priority == null ? 50 : next.priority;
          if (nextPriority < priority)
            break;
        }
        result.splice(i, 0, rule);
      }
      for (let name in schema.marks) {
        let rules = schema.marks[name].spec.parseDOM;
        if (rules)
          rules.forEach((rule) => {
            insert(rule = copy(rule));
            if (!(rule.mark || rule.ignore || rule.clearMark))
              rule.mark = name;
          });
      }
      for (let name in schema.nodes) {
        let rules = schema.nodes[name].spec.parseDOM;
        if (rules)
          rules.forEach((rule) => {
            insert(rule = copy(rule));
            if (!(rule.node || rule.ignore || rule.mark))
              rule.node = name;
          });
      }
      return result;
    }
    /**
    Construct a DOM parser using the parsing rules listed in a
    schema's [node specs](https://prosemirror.net/docs/ref/#model.NodeSpec.parseDOM), reordered by
    [priority](https://prosemirror.net/docs/ref/#model.ParseRule.priority).
    */
    static fromSchema(schema) {
      return schema.cached.domParser || (schema.cached.domParser = new _DOMParser(schema, _DOMParser.schemaRules(schema)));
    }
  };
  var blockTags = {
    address: true,
    article: true,
    aside: true,
    blockquote: true,
    canvas: true,
    dd: true,
    div: true,
    dl: true,
    fieldset: true,
    figcaption: true,
    figure: true,
    footer: true,
    form: true,
    h1: true,
    h2: true,
    h3: true,
    h4: true,
    h5: true,
    h6: true,
    header: true,
    hgroup: true,
    hr: true,
    li: true,
    noscript: true,
    ol: true,
    output: true,
    p: true,
    pre: true,
    section: true,
    table: true,
    tfoot: true,
    ul: true
  };
  var ignoreTags = {
    head: true,
    noscript: true,
    object: true,
    script: true,
    style: true,
    title: true
  };
  var listTags = { ol: true, ul: true };
  var OPT_PRESERVE_WS = 1;
  var OPT_PRESERVE_WS_FULL = 2;
  var OPT_OPEN_LEFT = 4;
  function wsOptionsFor(type, preserveWhitespace, base) {
    if (preserveWhitespace != null)
      return (preserveWhitespace ? OPT_PRESERVE_WS : 0) | (preserveWhitespace === "full" ? OPT_PRESERVE_WS_FULL : 0);
    return type && type.whitespace == "pre" ? OPT_PRESERVE_WS | OPT_PRESERVE_WS_FULL : base & ~OPT_OPEN_LEFT;
  }
  var NodeContext = class {
    constructor(type, attrs, marks, pendingMarks, solid, match, options) {
      this.type = type;
      this.attrs = attrs;
      this.marks = marks;
      this.pendingMarks = pendingMarks;
      this.solid = solid;
      this.options = options;
      this.content = [];
      this.activeMarks = Mark.none;
      this.stashMarks = [];
      this.match = match || (options & OPT_OPEN_LEFT ? null : type.contentMatch);
    }
    findWrapping(node) {
      if (!this.match) {
        if (!this.type)
          return [];
        let fill = this.type.contentMatch.fillBefore(Fragment.from(node));
        if (fill) {
          this.match = this.type.contentMatch.matchFragment(fill);
        } else {
          let start = this.type.contentMatch, wrap2;
          if (wrap2 = start.findWrapping(node.type)) {
            this.match = start;
            return wrap2;
          } else {
            return null;
          }
        }
      }
      return this.match.findWrapping(node.type);
    }
    finish(openEnd) {
      if (!(this.options & OPT_PRESERVE_WS)) {
        let last = this.content[this.content.length - 1], m;
        if (last && last.isText && (m = /[ \t\r\n\u000c]+$/.exec(last.text))) {
          let text = last;
          if (last.text.length == m[0].length)
            this.content.pop();
          else
            this.content[this.content.length - 1] = text.withText(text.text.slice(0, text.text.length - m[0].length));
        }
      }
      let content = Fragment.from(this.content);
      if (!openEnd && this.match)
        content = content.append(this.match.fillBefore(Fragment.empty, true));
      return this.type ? this.type.create(this.attrs, content, this.marks) : content;
    }
    popFromStashMark(mark) {
      for (let i = this.stashMarks.length - 1; i >= 0; i--)
        if (mark.eq(this.stashMarks[i]))
          return this.stashMarks.splice(i, 1)[0];
    }
    applyPending(nextType) {
      for (let i = 0, pending = this.pendingMarks; i < pending.length; i++) {
        let mark = pending[i];
        if ((this.type ? this.type.allowsMarkType(mark.type) : markMayApply(mark.type, nextType)) && !mark.isInSet(this.activeMarks)) {
          this.activeMarks = mark.addToSet(this.activeMarks);
          this.pendingMarks = mark.removeFromSet(this.pendingMarks);
        }
      }
    }
    inlineContext(node) {
      if (this.type)
        return this.type.inlineContent;
      if (this.content.length)
        return this.content[0].isInline;
      return node.parentNode && !blockTags.hasOwnProperty(node.parentNode.nodeName.toLowerCase());
    }
  };
  var ParseContext = class {
    constructor(parser, options, isOpen) {
      this.parser = parser;
      this.options = options;
      this.isOpen = isOpen;
      this.open = 0;
      let topNode = options.topNode, topContext;
      let topOptions = wsOptionsFor(null, options.preserveWhitespace, 0) | (isOpen ? OPT_OPEN_LEFT : 0);
      if (topNode)
        topContext = new NodeContext(topNode.type, topNode.attrs, Mark.none, Mark.none, true, options.topMatch || topNode.type.contentMatch, topOptions);
      else if (isOpen)
        topContext = new NodeContext(null, null, Mark.none, Mark.none, true, null, topOptions);
      else
        topContext = new NodeContext(parser.schema.topNodeType, null, Mark.none, Mark.none, true, null, topOptions);
      this.nodes = [topContext];
      this.find = options.findPositions;
      this.needsBlock = false;
    }
    get top() {
      return this.nodes[this.open];
    }
    // Add a DOM node to the content. Text is inserted as text node,
    // otherwise, the node is passed to `addElement` or, if it has a
    // `style` attribute, `addElementWithStyles`.
    addDOM(dom) {
      if (dom.nodeType == 3)
        this.addTextNode(dom);
      else if (dom.nodeType == 1)
        this.addElement(dom);
    }
    withStyleRules(dom, f) {
      let style = dom.getAttribute("style");
      if (!style)
        return f();
      let marks = this.readStyles(parseStyles(style));
      if (!marks)
        return;
      let [addMarks, removeMarks] = marks, top = this.top;
      for (let i = 0; i < removeMarks.length; i++)
        this.removePendingMark(removeMarks[i], top);
      for (let i = 0; i < addMarks.length; i++)
        this.addPendingMark(addMarks[i]);
      f();
      for (let i = 0; i < addMarks.length; i++)
        this.removePendingMark(addMarks[i], top);
      for (let i = 0; i < removeMarks.length; i++)
        this.addPendingMark(removeMarks[i]);
    }
    addTextNode(dom) {
      let value = dom.nodeValue;
      let top = this.top;
      if (top.options & OPT_PRESERVE_WS_FULL || top.inlineContext(dom) || /[^ \t\r\n\u000c]/.test(value)) {
        if (!(top.options & OPT_PRESERVE_WS)) {
          value = value.replace(/[ \t\r\n\u000c]+/g, " ");
          if (/^[ \t\r\n\u000c]/.test(value) && this.open == this.nodes.length - 1) {
            let nodeBefore = top.content[top.content.length - 1];
            let domNodeBefore = dom.previousSibling;
            if (!nodeBefore || domNodeBefore && domNodeBefore.nodeName == "BR" || nodeBefore.isText && /[ \t\r\n\u000c]$/.test(nodeBefore.text))
              value = value.slice(1);
          }
        } else if (!(top.options & OPT_PRESERVE_WS_FULL)) {
          value = value.replace(/\r?\n|\r/g, " ");
        } else {
          value = value.replace(/\r\n?/g, "\n");
        }
        if (value)
          this.insertNode(this.parser.schema.text(value));
        this.findInText(dom);
      } else {
        this.findInside(dom);
      }
    }
    // Try to find a handler for the given tag and use that to parse. If
    // none is found, the element's content nodes are added directly.
    addElement(dom, matchAfter) {
      let name = dom.nodeName.toLowerCase(), ruleID;
      if (listTags.hasOwnProperty(name) && this.parser.normalizeLists)
        normalizeList(dom);
      let rule = this.options.ruleFromNode && this.options.ruleFromNode(dom) || (ruleID = this.parser.matchTag(dom, this, matchAfter));
      if (rule ? rule.ignore : ignoreTags.hasOwnProperty(name)) {
        this.findInside(dom);
        this.ignoreFallback(dom);
      } else if (!rule || rule.skip || rule.closeParent) {
        if (rule && rule.closeParent)
          this.open = Math.max(0, this.open - 1);
        else if (rule && rule.skip.nodeType)
          dom = rule.skip;
        let sync, top = this.top, oldNeedsBlock = this.needsBlock;
        if (blockTags.hasOwnProperty(name)) {
          if (top.content.length && top.content[0].isInline && this.open) {
            this.open--;
            top = this.top;
          }
          sync = true;
          if (!top.type)
            this.needsBlock = true;
        } else if (!dom.firstChild) {
          this.leafFallback(dom);
          return;
        }
        if (rule && rule.skip)
          this.addAll(dom);
        else
          this.withStyleRules(dom, () => this.addAll(dom));
        if (sync)
          this.sync(top);
        this.needsBlock = oldNeedsBlock;
      } else {
        this.withStyleRules(dom, () => {
          this.addElementByRule(dom, rule, rule.consuming === false ? ruleID : void 0);
        });
      }
    }
    // Called for leaf DOM nodes that would otherwise be ignored
    leafFallback(dom) {
      if (dom.nodeName == "BR" && this.top.type && this.top.type.inlineContent)
        this.addTextNode(dom.ownerDocument.createTextNode("\n"));
    }
    // Called for ignored nodes
    ignoreFallback(dom) {
      if (dom.nodeName == "BR" && (!this.top.type || !this.top.type.inlineContent))
        this.findPlace(this.parser.schema.text("-"));
    }
    // Run any style parser associated with the node's styles. Either
    // return an array of marks, or null to indicate some of the styles
    // had a rule with `ignore` set.
    readStyles(styles) {
      let add = Mark.none, remove = Mark.none;
      for (let i = 0; i < styles.length; i += 2) {
        for (let after = void 0; ; ) {
          let rule = this.parser.matchStyle(styles[i], styles[i + 1], this, after);
          if (!rule)
            break;
          if (rule.ignore)
            return null;
          if (rule.clearMark) {
            this.top.pendingMarks.concat(this.top.activeMarks).forEach((m) => {
              if (rule.clearMark(m))
                remove = m.addToSet(remove);
            });
          } else {
            add = this.parser.schema.marks[rule.mark].create(rule.attrs).addToSet(add);
          }
          if (rule.consuming === false)
            after = rule;
          else
            break;
        }
      }
      return [add, remove];
    }
    // Look up a handler for the given node. If none are found, return
    // false. Otherwise, apply it, use its return value to drive the way
    // the node's content is wrapped, and return true.
    addElementByRule(dom, rule, continueAfter) {
      let sync, nodeType, mark;
      if (rule.node) {
        nodeType = this.parser.schema.nodes[rule.node];
        if (!nodeType.isLeaf) {
          sync = this.enter(nodeType, rule.attrs || null, rule.preserveWhitespace);
        } else if (!this.insertNode(nodeType.create(rule.attrs))) {
          this.leafFallback(dom);
        }
      } else {
        let markType = this.parser.schema.marks[rule.mark];
        mark = markType.create(rule.attrs);
        this.addPendingMark(mark);
      }
      let startIn = this.top;
      if (nodeType && nodeType.isLeaf) {
        this.findInside(dom);
      } else if (continueAfter) {
        this.addElement(dom, continueAfter);
      } else if (rule.getContent) {
        this.findInside(dom);
        rule.getContent(dom, this.parser.schema).forEach((node) => this.insertNode(node));
      } else {
        let contentDOM = dom;
        if (typeof rule.contentElement == "string")
          contentDOM = dom.querySelector(rule.contentElement);
        else if (typeof rule.contentElement == "function")
          contentDOM = rule.contentElement(dom);
        else if (rule.contentElement)
          contentDOM = rule.contentElement;
        this.findAround(dom, contentDOM, true);
        this.addAll(contentDOM);
      }
      if (sync && this.sync(startIn))
        this.open--;
      if (mark)
        this.removePendingMark(mark, startIn);
    }
    // Add all child nodes between `startIndex` and `endIndex` (or the
    // whole node, if not given). If `sync` is passed, use it to
    // synchronize after every block element.
    addAll(parent, startIndex, endIndex) {
      let index = startIndex || 0;
      for (let dom = startIndex ? parent.childNodes[startIndex] : parent.firstChild, end = endIndex == null ? null : parent.childNodes[endIndex]; dom != end; dom = dom.nextSibling, ++index) {
        this.findAtPoint(parent, index);
        this.addDOM(dom);
      }
      this.findAtPoint(parent, index);
    }
    // Try to find a way to fit the given node type into the current
    // context. May add intermediate wrappers and/or leave non-solid
    // nodes that we're in.
    findPlace(node) {
      let route, sync;
      for (let depth = this.open; depth >= 0; depth--) {
        let cx = this.nodes[depth];
        let found2 = cx.findWrapping(node);
        if (found2 && (!route || route.length > found2.length)) {
          route = found2;
          sync = cx;
          if (!found2.length)
            break;
        }
        if (cx.solid)
          break;
      }
      if (!route)
        return false;
      this.sync(sync);
      for (let i = 0; i < route.length; i++)
        this.enterInner(route[i], null, false);
      return true;
    }
    // Try to insert the given node, adjusting the context when needed.
    insertNode(node) {
      if (node.isInline && this.needsBlock && !this.top.type) {
        let block = this.textblockFromContext();
        if (block)
          this.enterInner(block);
      }
      if (this.findPlace(node)) {
        this.closeExtra();
        let top = this.top;
        top.applyPending(node.type);
        if (top.match)
          top.match = top.match.matchType(node.type);
        let marks = top.activeMarks;
        for (let i = 0; i < node.marks.length; i++)
          if (!top.type || top.type.allowsMarkType(node.marks[i].type))
            marks = node.marks[i].addToSet(marks);
        top.content.push(node.mark(marks));
        return true;
      }
      return false;
    }
    // Try to start a node of the given type, adjusting the context when
    // necessary.
    enter(type, attrs, preserveWS) {
      let ok = this.findPlace(type.create(attrs));
      if (ok)
        this.enterInner(type, attrs, true, preserveWS);
      return ok;
    }
    // Open a node of the given type
    enterInner(type, attrs = null, solid = false, preserveWS) {
      this.closeExtra();
      let top = this.top;
      top.applyPending(type);
      top.match = top.match && top.match.matchType(type);
      let options = wsOptionsFor(type, preserveWS, top.options);
      if (top.options & OPT_OPEN_LEFT && top.content.length == 0)
        options |= OPT_OPEN_LEFT;
      this.nodes.push(new NodeContext(type, attrs, top.activeMarks, top.pendingMarks, solid, null, options));
      this.open++;
    }
    // Make sure all nodes above this.open are finished and added to
    // their parents
    closeExtra(openEnd = false) {
      let i = this.nodes.length - 1;
      if (i > this.open) {
        for (; i > this.open; i--)
          this.nodes[i - 1].content.push(this.nodes[i].finish(openEnd));
        this.nodes.length = this.open + 1;
      }
    }
    finish() {
      this.open = 0;
      this.closeExtra(this.isOpen);
      return this.nodes[0].finish(this.isOpen || this.options.topOpen);
    }
    sync(to) {
      for (let i = this.open; i >= 0; i--)
        if (this.nodes[i] == to) {
          this.open = i;
          return true;
        }
      return false;
    }
    get currentPos() {
      this.closeExtra();
      let pos = 0;
      for (let i = this.open; i >= 0; i--) {
        let content = this.nodes[i].content;
        for (let j = content.length - 1; j >= 0; j--)
          pos += content[j].nodeSize;
        if (i)
          pos++;
      }
      return pos;
    }
    findAtPoint(parent, offset) {
      if (this.find)
        for (let i = 0; i < this.find.length; i++) {
          if (this.find[i].node == parent && this.find[i].offset == offset)
            this.find[i].pos = this.currentPos;
        }
    }
    findInside(parent) {
      if (this.find)
        for (let i = 0; i < this.find.length; i++) {
          if (this.find[i].pos == null && parent.nodeType == 1 && parent.contains(this.find[i].node))
            this.find[i].pos = this.currentPos;
        }
    }
    findAround(parent, content, before) {
      if (parent != content && this.find)
        for (let i = 0; i < this.find.length; i++) {
          if (this.find[i].pos == null && parent.nodeType == 1 && parent.contains(this.find[i].node)) {
            let pos = content.compareDocumentPosition(this.find[i].node);
            if (pos & (before ? 2 : 4))
              this.find[i].pos = this.currentPos;
          }
        }
    }
    findInText(textNode) {
      if (this.find)
        for (let i = 0; i < this.find.length; i++) {
          if (this.find[i].node == textNode)
            this.find[i].pos = this.currentPos - (textNode.nodeValue.length - this.find[i].offset);
        }
    }
    // Determines whether the given context string matches this context.
    matchesContext(context) {
      if (context.indexOf("|") > -1)
        return context.split(/\s*\|\s*/).some(this.matchesContext, this);
      let parts = context.split("/");
      let option = this.options.context;
      let useRoot = !this.isOpen && (!option || option.parent.type == this.nodes[0].type);
      let minDepth = -(option ? option.depth + 1 : 0) + (useRoot ? 0 : 1);
      let match = (i, depth) => {
        for (; i >= 0; i--) {
          let part = parts[i];
          if (part == "") {
            if (i == parts.length - 1 || i == 0)
              continue;
            for (; depth >= minDepth; depth--)
              if (match(i - 1, depth))
                return true;
            return false;
          } else {
            let next = depth > 0 || depth == 0 && useRoot ? this.nodes[depth].type : option && depth >= minDepth ? option.node(depth - minDepth).type : null;
            if (!next || next.name != part && next.groups.indexOf(part) == -1)
              return false;
            depth--;
          }
        }
        return true;
      };
      return match(parts.length - 1, this.open);
    }
    textblockFromContext() {
      let $context = this.options.context;
      if ($context)
        for (let d = $context.depth; d >= 0; d--) {
          let deflt = $context.node(d).contentMatchAt($context.indexAfter(d)).defaultType;
          if (deflt && deflt.isTextblock && deflt.defaultAttrs)
            return deflt;
        }
      for (let name in this.parser.schema.nodes) {
        let type = this.parser.schema.nodes[name];
        if (type.isTextblock && type.defaultAttrs)
          return type;
      }
    }
    addPendingMark(mark) {
      let found2 = findSameMarkInSet(mark, this.top.pendingMarks);
      if (found2)
        this.top.stashMarks.push(found2);
      this.top.pendingMarks = mark.addToSet(this.top.pendingMarks);
    }
    removePendingMark(mark, upto) {
      for (let depth = this.open; depth >= 0; depth--) {
        let level = this.nodes[depth];
        let found2 = level.pendingMarks.lastIndexOf(mark);
        if (found2 > -1) {
          level.pendingMarks = mark.removeFromSet(level.pendingMarks);
        } else {
          level.activeMarks = mark.removeFromSet(level.activeMarks);
          let stashMark = level.popFromStashMark(mark);
          if (stashMark && level.type && level.type.allowsMarkType(stashMark.type))
            level.activeMarks = stashMark.addToSet(level.activeMarks);
        }
        if (level == upto)
          break;
      }
    }
  };
  function normalizeList(dom) {
    for (let child = dom.firstChild, prevItem = null; child; child = child.nextSibling) {
      let name = child.nodeType == 1 ? child.nodeName.toLowerCase() : null;
      if (name && listTags.hasOwnProperty(name) && prevItem) {
        prevItem.appendChild(child);
        child = prevItem;
      } else if (name == "li") {
        prevItem = child;
      } else if (name) {
        prevItem = null;
      }
    }
  }
  function matches(dom, selector) {
    return (dom.matches || dom.msMatchesSelector || dom.webkitMatchesSelector || dom.mozMatchesSelector).call(dom, selector);
  }
  function parseStyles(style) {
    let re = /\s*([\w-]+)\s*:\s*([^;]+)/g, m, result = [];
    while (m = re.exec(style))
      result.push(m[1], m[2].trim());
    return result;
  }
  function copy(obj) {
    let copy2 = {};
    for (let prop in obj)
      copy2[prop] = obj[prop];
    return copy2;
  }
  function markMayApply(markType, nodeType) {
    let nodes = nodeType.schema.nodes;
    for (let name in nodes) {
      let parent = nodes[name];
      if (!parent.allowsMarkType(markType))
        continue;
      let seen = [], scan = (match) => {
        seen.push(match);
        for (let i = 0; i < match.edgeCount; i++) {
          let { type, next } = match.edge(i);
          if (type == nodeType)
            return true;
          if (seen.indexOf(next) < 0 && scan(next))
            return true;
        }
      };
      if (scan(parent.contentMatch))
        return true;
    }
  }
  function findSameMarkInSet(mark, set) {
    for (let i = 0; i < set.length; i++) {
      if (mark.eq(set[i]))
        return set[i];
    }
  }

  // node_modules/prosemirror-transform/dist/index.js
  var lower16 = 65535;
  var factor16 = Math.pow(2, 16);
  function makeRecover(index, offset) {
    return index + offset * factor16;
  }
  function recoverIndex(value) {
    return value & lower16;
  }
  function recoverOffset(value) {
    return (value - (value & lower16)) / factor16;
  }
  var DEL_BEFORE = 1;
  var DEL_AFTER = 2;
  var DEL_ACROSS = 4;
  var DEL_SIDE = 8;
  var MapResult = class {
    /**
    @internal
    */
    constructor(pos, delInfo, recover) {
      this.pos = pos;
      this.delInfo = delInfo;
      this.recover = recover;
    }
    /**
    Tells you whether the position was deleted, that is, whether the
    step removed the token on the side queried (via the `assoc`)
    argument from the document.
    */
    get deleted() {
      return (this.delInfo & DEL_SIDE) > 0;
    }
    /**
    Tells you whether the token before the mapped position was deleted.
    */
    get deletedBefore() {
      return (this.delInfo & (DEL_BEFORE | DEL_ACROSS)) > 0;
    }
    /**
    True when the token after the mapped position was deleted.
    */
    get deletedAfter() {
      return (this.delInfo & (DEL_AFTER | DEL_ACROSS)) > 0;
    }
    /**
    Tells whether any of the steps mapped through deletes across the
    position (including both the token before and after the
    position).
    */
    get deletedAcross() {
      return (this.delInfo & DEL_ACROSS) > 0;
    }
  };
  var StepMap = class _StepMap {
    /**
    Create a position map. The modifications to the document are
    represented as an array of numbers, in which each group of three
    represents a modified chunk as `[start, oldSize, newSize]`.
    */
    constructor(ranges, inverted = false) {
      this.ranges = ranges;
      this.inverted = inverted;
      if (!ranges.length && _StepMap.empty)
        return _StepMap.empty;
    }
    /**
    @internal
    */
    recover(value) {
      let diff = 0, index = recoverIndex(value);
      if (!this.inverted)
        for (let i = 0; i < index; i++)
          diff += this.ranges[i * 3 + 2] - this.ranges[i * 3 + 1];
      return this.ranges[index * 3] + diff + recoverOffset(value);
    }
    mapResult(pos, assoc = 1) {
      return this._map(pos, assoc, false);
    }
    map(pos, assoc = 1) {
      return this._map(pos, assoc, true);
    }
    /**
    @internal
    */
    _map(pos, assoc, simple) {
      let diff = 0, oldIndex = this.inverted ? 2 : 1, newIndex = this.inverted ? 1 : 2;
      for (let i = 0; i < this.ranges.length; i += 3) {
        let start = this.ranges[i] - (this.inverted ? diff : 0);
        if (start > pos)
          break;
        let oldSize = this.ranges[i + oldIndex], newSize = this.ranges[i + newIndex], end = start + oldSize;
        if (pos <= end) {
          let side = !oldSize ? assoc : pos == start ? -1 : pos == end ? 1 : assoc;
          let result = start + diff + (side < 0 ? 0 : newSize);
          if (simple)
            return result;
          let recover = pos == (assoc < 0 ? start : end) ? null : makeRecover(i / 3, pos - start);
          let del2 = pos == start ? DEL_AFTER : pos == end ? DEL_BEFORE : DEL_ACROSS;
          if (assoc < 0 ? pos != start : pos != end)
            del2 |= DEL_SIDE;
          return new MapResult(result, del2, recover);
        }
        diff += newSize - oldSize;
      }
      return simple ? pos + diff : new MapResult(pos + diff, 0, null);
    }
    /**
    @internal
    */
    touches(pos, recover) {
      let diff = 0, index = recoverIndex(recover);
      let oldIndex = this.inverted ? 2 : 1, newIndex = this.inverted ? 1 : 2;
      for (let i = 0; i < this.ranges.length; i += 3) {
        let start = this.ranges[i] - (this.inverted ? diff : 0);
        if (start > pos)
          break;
        let oldSize = this.ranges[i + oldIndex], end = start + oldSize;
        if (pos <= end && i == index * 3)
          return true;
        diff += this.ranges[i + newIndex] - oldSize;
      }
      return false;
    }
    /**
    Calls the given function on each of the changed ranges included in
    this map.
    */
    forEach(f) {
      let oldIndex = this.inverted ? 2 : 1, newIndex = this.inverted ? 1 : 2;
      for (let i = 0, diff = 0; i < this.ranges.length; i += 3) {
        let start = this.ranges[i], oldStart = start - (this.inverted ? diff : 0), newStart = start + (this.inverted ? 0 : diff);
        let oldSize = this.ranges[i + oldIndex], newSize = this.ranges[i + newIndex];
        f(oldStart, oldStart + oldSize, newStart, newStart + newSize);
        diff += newSize - oldSize;
      }
    }
    /**
    Create an inverted version of this map. The result can be used to
    map positions in the post-step document to the pre-step document.
    */
    invert() {
      return new _StepMap(this.ranges, !this.inverted);
    }
    /**
    @internal
    */
    toString() {
      return (this.inverted ? "-" : "") + JSON.stringify(this.ranges);
    }
    /**
    Create a map that moves all positions by offset `n` (which may be
    negative). This can be useful when applying steps meant for a
    sub-document to a larger document, or vice-versa.
    */
    static offset(n) {
      return n == 0 ? _StepMap.empty : new _StepMap(n < 0 ? [0, -n, 0] : [0, 0, n]);
    }
  };
  StepMap.empty = new StepMap([]);
  var Mapping = class _Mapping {
    /**
    Create a new mapping with the given position maps.
    */
    constructor(maps = [], mirror, from = 0, to = maps.length) {
      this.maps = maps;
      this.mirror = mirror;
      this.from = from;
      this.to = to;
    }
    /**
    Create a mapping that maps only through a part of this one.
    */
    slice(from = 0, to = this.maps.length) {
      return new _Mapping(this.maps, this.mirror, from, to);
    }
    /**
    @internal
    */
    copy() {
      return new _Mapping(this.maps.slice(), this.mirror && this.mirror.slice(), this.from, this.to);
    }
    /**
    Add a step map to the end of this mapping. If `mirrors` is
    given, it should be the index of the step map that is the mirror
    image of this one.
    */
    appendMap(map, mirrors) {
      this.to = this.maps.push(map);
      if (mirrors != null)
        this.setMirror(this.maps.length - 1, mirrors);
    }
    /**
    Add all the step maps in a given mapping to this one (preserving
    mirroring information).
    */
    appendMapping(mapping) {
      for (let i = 0, startSize = this.maps.length; i < mapping.maps.length; i++) {
        let mirr = mapping.getMirror(i);
        this.appendMap(mapping.maps[i], mirr != null && mirr < i ? startSize + mirr : void 0);
      }
    }
    /**
    Finds the offset of the step map that mirrors the map at the
    given offset, in this mapping (as per the second argument to
    `appendMap`).
    */
    getMirror(n) {
      if (this.mirror) {
        for (let i = 0; i < this.mirror.length; i++)
          if (this.mirror[i] == n)
            return this.mirror[i + (i % 2 ? -1 : 1)];
      }
    }
    /**
    @internal
    */
    setMirror(n, m) {
      if (!this.mirror)
        this.mirror = [];
      this.mirror.push(n, m);
    }
    /**
    Append the inverse of the given mapping to this one.
    */
    appendMappingInverted(mapping) {
      for (let i = mapping.maps.length - 1, totalSize = this.maps.length + mapping.maps.length; i >= 0; i--) {
        let mirr = mapping.getMirror(i);
        this.appendMap(mapping.maps[i].invert(), mirr != null && mirr > i ? totalSize - mirr - 1 : void 0);
      }
    }
    /**
    Create an inverted version of this mapping.
    */
    invert() {
      let inverse = new _Mapping();
      inverse.appendMappingInverted(this);
      return inverse;
    }
    /**
    Map a position through this mapping.
    */
    map(pos, assoc = 1) {
      if (this.mirror)
        return this._map(pos, assoc, true);
      for (let i = this.from; i < this.to; i++)
        pos = this.maps[i].map(pos, assoc);
      return pos;
    }
    /**
    Map a position through this mapping, returning a mapping
    result.
    */
    mapResult(pos, assoc = 1) {
      return this._map(pos, assoc, false);
    }
    /**
    @internal
    */
    _map(pos, assoc, simple) {
      let delInfo = 0;
      for (let i = this.from; i < this.to; i++) {
        let map = this.maps[i], result = map.mapResult(pos, assoc);
        if (result.recover != null) {
          let corr = this.getMirror(i);
          if (corr != null && corr > i && corr < this.to) {
            i = corr;
            pos = this.maps[corr].recover(result.recover);
            continue;
          }
        }
        delInfo |= result.delInfo;
        pos = result.pos;
      }
      return simple ? pos : new MapResult(pos, delInfo, null);
    }
  };
  var stepsByID = /* @__PURE__ */ Object.create(null);
  var Step = class {
    /**
    Get the step map that represents the changes made by this step,
    and which can be used to transform between positions in the old
    and the new document.
    */
    getMap() {
      return StepMap.empty;
    }
    /**
    Try to merge this step with another one, to be applied directly
    after it. Returns the merged step when possible, null if the
    steps can't be merged.
    */
    merge(other) {
      return null;
    }
    /**
    Deserialize a step from its JSON representation. Will call
    through to the step class' own implementation of this method.
    */
    static fromJSON(schema, json) {
      if (!json || !json.stepType)
        throw new RangeError("Invalid input for Step.fromJSON");
      let type = stepsByID[json.stepType];
      if (!type)
        throw new RangeError(`No step type ${json.stepType} defined`);
      return type.fromJSON(schema, json);
    }
    /**
    To be able to serialize steps to JSON, each step needs a string
    ID to attach to its JSON representation. Use this method to
    register an ID for your step classes. Try to pick something
    that's unlikely to clash with steps from other modules.
    */
    static jsonID(id, stepClass) {
      if (id in stepsByID)
        throw new RangeError("Duplicate use of step JSON ID " + id);
      stepsByID[id] = stepClass;
      stepClass.prototype.jsonID = id;
      return stepClass;
    }
  };
  var StepResult = class _StepResult {
    /**
    @internal
    */
    constructor(doc, failed) {
      this.doc = doc;
      this.failed = failed;
    }
    /**
    Create a successful step result.
    */
    static ok(doc) {
      return new _StepResult(doc, null);
    }
    /**
    Create a failed step result.
    */
    static fail(message) {
      return new _StepResult(null, message);
    }
    /**
    Call [`Node.replace`](https://prosemirror.net/docs/ref/#model.Node.replace) with the given
    arguments. Create a successful result if it succeeds, and a
    failed one if it throws a `ReplaceError`.
    */
    static fromReplace(doc, from, to, slice) {
      try {
        return _StepResult.ok(doc.replace(from, to, slice));
      } catch (e) {
        if (e instanceof ReplaceError)
          return _StepResult.fail(e.message);
        throw e;
      }
    }
  };
  function mapFragment(fragment, f, parent) {
    let mapped = [];
    for (let i = 0; i < fragment.childCount; i++) {
      let child = fragment.child(i);
      if (child.content.size)
        child = child.copy(mapFragment(child.content, f, child));
      if (child.isInline)
        child = f(child, parent, i);
      mapped.push(child);
    }
    return Fragment.fromArray(mapped);
  }
  var AddMarkStep = class _AddMarkStep extends Step {
    /**
    Create a mark step.
    */
    constructor(from, to, mark) {
      super();
      this.from = from;
      this.to = to;
      this.mark = mark;
    }
    apply(doc) {
      let oldSlice = doc.slice(this.from, this.to), $from = doc.resolve(this.from);
      let parent = $from.node($from.sharedDepth(this.to));
      let slice = new Slice(mapFragment(oldSlice.content, (node, parent2) => {
        if (!node.isAtom || !parent2.type.allowsMarkType(this.mark.type))
          return node;
        return node.mark(this.mark.addToSet(node.marks));
      }, parent), oldSlice.openStart, oldSlice.openEnd);
      return StepResult.fromReplace(doc, this.from, this.to, slice);
    }
    invert() {
      return new RemoveMarkStep(this.from, this.to, this.mark);
    }
    map(mapping) {
      let from = mapping.mapResult(this.from, 1), to = mapping.mapResult(this.to, -1);
      if (from.deleted && to.deleted || from.pos >= to.pos)
        return null;
      return new _AddMarkStep(from.pos, to.pos, this.mark);
    }
    merge(other) {
      if (other instanceof _AddMarkStep && other.mark.eq(this.mark) && this.from <= other.to && this.to >= other.from)
        return new _AddMarkStep(Math.min(this.from, other.from), Math.max(this.to, other.to), this.mark);
      return null;
    }
    toJSON() {
      return {
        stepType: "addMark",
        mark: this.mark.toJSON(),
        from: this.from,
        to: this.to
      };
    }
    /**
    @internal
    */
    static fromJSON(schema, json) {
      if (typeof json.from != "number" || typeof json.to != "number")
        throw new RangeError("Invalid input for AddMarkStep.fromJSON");
      return new _AddMarkStep(json.from, json.to, schema.markFromJSON(json.mark));
    }
  };
  Step.jsonID("addMark", AddMarkStep);
  var RemoveMarkStep = class _RemoveMarkStep extends Step {
    /**
    Create a mark-removing step.
    */
    constructor(from, to, mark) {
      super();
      this.from = from;
      this.to = to;
      this.mark = mark;
    }
    apply(doc) {
      let oldSlice = doc.slice(this.from, this.to);
      let slice = new Slice(mapFragment(oldSlice.content, (node) => {
        return node.mark(this.mark.removeFromSet(node.marks));
      }, doc), oldSlice.openStart, oldSlice.openEnd);
      return StepResult.fromReplace(doc, this.from, this.to, slice);
    }
    invert() {
      return new AddMarkStep(this.from, this.to, this.mark);
    }
    map(mapping) {
      let from = mapping.mapResult(this.from, 1), to = mapping.mapResult(this.to, -1);
      if (from.deleted && to.deleted || from.pos >= to.pos)
        return null;
      return new _RemoveMarkStep(from.pos, to.pos, this.mark);
    }
    merge(other) {
      if (other instanceof _RemoveMarkStep && other.mark.eq(this.mark) && this.from <= other.to && this.to >= other.from)
        return new _RemoveMarkStep(Math.min(this.from, other.from), Math.max(this.to, other.to), this.mark);
      return null;
    }
    toJSON() {
      return {
        stepType: "removeMark",
        mark: this.mark.toJSON(),
        from: this.from,
        to: this.to
      };
    }
    /**
    @internal
    */
    static fromJSON(schema, json) {
      if (typeof json.from != "number" || typeof json.to != "number")
        throw new RangeError("Invalid input for RemoveMarkStep.fromJSON");
      return new _RemoveMarkStep(json.from, json.to, schema.markFromJSON(json.mark));
    }
  };
  Step.jsonID("removeMark", RemoveMarkStep);
  var AddNodeMarkStep = class _AddNodeMarkStep extends Step {
    /**
    Create a node mark step.
    */
    constructor(pos, mark) {
      super();
      this.pos = pos;
      this.mark = mark;
    }
    apply(doc) {
      let node = doc.nodeAt(this.pos);
      if (!node)
        return StepResult.fail("No node at mark step's position");
      let updated = node.type.create(node.attrs, null, this.mark.addToSet(node.marks));
      return StepResult.fromReplace(doc, this.pos, this.pos + 1, new Slice(Fragment.from(updated), 0, node.isLeaf ? 0 : 1));
    }
    invert(doc) {
      let node = doc.nodeAt(this.pos);
      if (node) {
        let newSet = this.mark.addToSet(node.marks);
        if (newSet.length == node.marks.length) {
          for (let i = 0; i < node.marks.length; i++)
            if (!node.marks[i].isInSet(newSet))
              return new _AddNodeMarkStep(this.pos, node.marks[i]);
          return new _AddNodeMarkStep(this.pos, this.mark);
        }
      }
      return new RemoveNodeMarkStep(this.pos, this.mark);
    }
    map(mapping) {
      let pos = mapping.mapResult(this.pos, 1);
      return pos.deletedAfter ? null : new _AddNodeMarkStep(pos.pos, this.mark);
    }
    toJSON() {
      return { stepType: "addNodeMark", pos: this.pos, mark: this.mark.toJSON() };
    }
    /**
    @internal
    */
    static fromJSON(schema, json) {
      if (typeof json.pos != "number")
        throw new RangeError("Invalid input for AddNodeMarkStep.fromJSON");
      return new _AddNodeMarkStep(json.pos, schema.markFromJSON(json.mark));
    }
  };
  Step.jsonID("addNodeMark", AddNodeMarkStep);
  var RemoveNodeMarkStep = class _RemoveNodeMarkStep extends Step {
    /**
    Create a mark-removing step.
    */
    constructor(pos, mark) {
      super();
      this.pos = pos;
      this.mark = mark;
    }
    apply(doc) {
      let node = doc.nodeAt(this.pos);
      if (!node)
        return StepResult.fail("No node at mark step's position");
      let updated = node.type.create(node.attrs, null, this.mark.removeFromSet(node.marks));
      return StepResult.fromReplace(doc, this.pos, this.pos + 1, new Slice(Fragment.from(updated), 0, node.isLeaf ? 0 : 1));
    }
    invert(doc) {
      let node = doc.nodeAt(this.pos);
      if (!node || !this.mark.isInSet(node.marks))
        return this;
      return new AddNodeMarkStep(this.pos, this.mark);
    }
    map(mapping) {
      let pos = mapping.mapResult(this.pos, 1);
      return pos.deletedAfter ? null : new _RemoveNodeMarkStep(pos.pos, this.mark);
    }
    toJSON() {
      return { stepType: "removeNodeMark", pos: this.pos, mark: this.mark.toJSON() };
    }
    /**
    @internal
    */
    static fromJSON(schema, json) {
      if (typeof json.pos != "number")
        throw new RangeError("Invalid input for RemoveNodeMarkStep.fromJSON");
      return new _RemoveNodeMarkStep(json.pos, schema.markFromJSON(json.mark));
    }
  };
  Step.jsonID("removeNodeMark", RemoveNodeMarkStep);
  var ReplaceStep = class _ReplaceStep extends Step {
    /**
    The given `slice` should fit the 'gap' between `from` and
    `to`—the depths must line up, and the surrounding nodes must be
    able to be joined with the open sides of the slice. When
    `structure` is true, the step will fail if the content between
    from and to is not just a sequence of closing and then opening
    tokens (this is to guard against rebased replace steps
    overwriting something they weren't supposed to).
    */
    constructor(from, to, slice, structure = false) {
      super();
      this.from = from;
      this.to = to;
      this.slice = slice;
      this.structure = structure;
    }
    apply(doc) {
      if (this.structure && contentBetween(doc, this.from, this.to))
        return StepResult.fail("Structure replace would overwrite content");
      return StepResult.fromReplace(doc, this.from, this.to, this.slice);
    }
    getMap() {
      return new StepMap([this.from, this.to - this.from, this.slice.size]);
    }
    invert(doc) {
      return new _ReplaceStep(this.from, this.from + this.slice.size, doc.slice(this.from, this.to));
    }
    map(mapping) {
      let from = mapping.mapResult(this.from, 1), to = mapping.mapResult(this.to, -1);
      if (from.deletedAcross && to.deletedAcross)
        return null;
      return new _ReplaceStep(from.pos, Math.max(from.pos, to.pos), this.slice);
    }
    merge(other) {
      if (!(other instanceof _ReplaceStep) || other.structure || this.structure)
        return null;
      if (this.from + this.slice.size == other.from && !this.slice.openEnd && !other.slice.openStart) {
        let slice = this.slice.size + other.slice.size == 0 ? Slice.empty : new Slice(this.slice.content.append(other.slice.content), this.slice.openStart, other.slice.openEnd);
        return new _ReplaceStep(this.from, this.to + (other.to - other.from), slice, this.structure);
      } else if (other.to == this.from && !this.slice.openStart && !other.slice.openEnd) {
        let slice = this.slice.size + other.slice.size == 0 ? Slice.empty : new Slice(other.slice.content.append(this.slice.content), other.slice.openStart, this.slice.openEnd);
        return new _ReplaceStep(other.from, this.to, slice, this.structure);
      } else {
        return null;
      }
    }
    toJSON() {
      let json = { stepType: "replace", from: this.from, to: this.to };
      if (this.slice.size)
        json.slice = this.slice.toJSON();
      if (this.structure)
        json.structure = true;
      return json;
    }
    /**
    @internal
    */
    static fromJSON(schema, json) {
      if (typeof json.from != "number" || typeof json.to != "number")
        throw new RangeError("Invalid input for ReplaceStep.fromJSON");
      return new _ReplaceStep(json.from, json.to, Slice.fromJSON(schema, json.slice), !!json.structure);
    }
  };
  Step.jsonID("replace", ReplaceStep);
  var ReplaceAroundStep = class _ReplaceAroundStep extends Step {
    /**
    Create a replace-around step with the given range and gap.
    `insert` should be the point in the slice into which the content
    of the gap should be moved. `structure` has the same meaning as
    it has in the [`ReplaceStep`](https://prosemirror.net/docs/ref/#transform.ReplaceStep) class.
    */
    constructor(from, to, gapFrom, gapTo, slice, insert, structure = false) {
      super();
      this.from = from;
      this.to = to;
      this.gapFrom = gapFrom;
      this.gapTo = gapTo;
      this.slice = slice;
      this.insert = insert;
      this.structure = structure;
    }
    apply(doc) {
      if (this.structure && (contentBetween(doc, this.from, this.gapFrom) || contentBetween(doc, this.gapTo, this.to)))
        return StepResult.fail("Structure gap-replace would overwrite content");
      let gap = doc.slice(this.gapFrom, this.gapTo);
      if (gap.openStart || gap.openEnd)
        return StepResult.fail("Gap is not a flat range");
      let inserted = this.slice.insertAt(this.insert, gap.content);
      if (!inserted)
        return StepResult.fail("Content does not fit in gap");
      return StepResult.fromReplace(doc, this.from, this.to, inserted);
    }
    getMap() {
      return new StepMap([
        this.from,
        this.gapFrom - this.from,
        this.insert,
        this.gapTo,
        this.to - this.gapTo,
        this.slice.size - this.insert
      ]);
    }
    invert(doc) {
      let gap = this.gapTo - this.gapFrom;
      return new _ReplaceAroundStep(this.from, this.from + this.slice.size + gap, this.from + this.insert, this.from + this.insert + gap, doc.slice(this.from, this.to).removeBetween(this.gapFrom - this.from, this.gapTo - this.from), this.gapFrom - this.from, this.structure);
    }
    map(mapping) {
      let from = mapping.mapResult(this.from, 1), to = mapping.mapResult(this.to, -1);
      let gapFrom = mapping.map(this.gapFrom, -1), gapTo = mapping.map(this.gapTo, 1);
      if (from.deletedAcross && to.deletedAcross || gapFrom < from.pos || gapTo > to.pos)
        return null;
      return new _ReplaceAroundStep(from.pos, to.pos, gapFrom, gapTo, this.slice, this.insert, this.structure);
    }
    toJSON() {
      let json = {
        stepType: "replaceAround",
        from: this.from,
        to: this.to,
        gapFrom: this.gapFrom,
        gapTo: this.gapTo,
        insert: this.insert
      };
      if (this.slice.size)
        json.slice = this.slice.toJSON();
      if (this.structure)
        json.structure = true;
      return json;
    }
    /**
    @internal
    */
    static fromJSON(schema, json) {
      if (typeof json.from != "number" || typeof json.to != "number" || typeof json.gapFrom != "number" || typeof json.gapTo != "number" || typeof json.insert != "number")
        throw new RangeError("Invalid input for ReplaceAroundStep.fromJSON");
      return new _ReplaceAroundStep(json.from, json.to, json.gapFrom, json.gapTo, Slice.fromJSON(schema, json.slice), json.insert, !!json.structure);
    }
  };
  Step.jsonID("replaceAround", ReplaceAroundStep);
  function contentBetween(doc, from, to) {
    let $from = doc.resolve(from), dist = to - from, depth = $from.depth;
    while (dist > 0 && depth > 0 && $from.indexAfter(depth) == $from.node(depth).childCount) {
      depth--;
      dist--;
    }
    if (dist > 0) {
      let next = $from.node(depth).maybeChild($from.indexAfter(depth));
      while (dist > 0) {
        if (!next || next.isLeaf)
          return true;
        next = next.firstChild;
        dist--;
      }
    }
    return false;
  }
  function addMark(tr2, from, to, mark) {
    let removed = [], added = [];
    let removing, adding;
    tr2.doc.nodesBetween(from, to, (node, pos, parent) => {
      if (!node.isInline)
        return;
      let marks = node.marks;
      if (!mark.isInSet(marks) && parent.type.allowsMarkType(mark.type)) {
        let start = Math.max(pos, from), end = Math.min(pos + node.nodeSize, to);
        let newSet = mark.addToSet(marks);
        for (let i = 0; i < marks.length; i++) {
          if (!marks[i].isInSet(newSet)) {
            if (removing && removing.to == start && removing.mark.eq(marks[i]))
              removing.to = end;
            else
              removed.push(removing = new RemoveMarkStep(start, end, marks[i]));
          }
        }
        if (adding && adding.to == start)
          adding.to = end;
        else
          added.push(adding = new AddMarkStep(start, end, mark));
      }
    });
    removed.forEach((s) => tr2.step(s));
    added.forEach((s) => tr2.step(s));
  }
  function removeMark(tr2, from, to, mark) {
    let matched = [], step = 0;
    tr2.doc.nodesBetween(from, to, (node, pos) => {
      if (!node.isInline)
        return;
      step++;
      let toRemove = null;
      if (mark instanceof MarkType) {
        let set = node.marks, found2;
        while (found2 = mark.isInSet(set)) {
          (toRemove || (toRemove = [])).push(found2);
          set = found2.removeFromSet(set);
        }
      } else if (mark) {
        if (mark.isInSet(node.marks))
          toRemove = [mark];
      } else {
        toRemove = node.marks;
      }
      if (toRemove && toRemove.length) {
        let end = Math.min(pos + node.nodeSize, to);
        for (let i = 0; i < toRemove.length; i++) {
          let style = toRemove[i], found2;
          for (let j = 0; j < matched.length; j++) {
            let m = matched[j];
            if (m.step == step - 1 && style.eq(matched[j].style))
              found2 = m;
          }
          if (found2) {
            found2.to = end;
            found2.step = step;
          } else {
            matched.push({ style, from: Math.max(pos, from), to: end, step });
          }
        }
      }
    });
    matched.forEach((m) => tr2.step(new RemoveMarkStep(m.from, m.to, m.style)));
  }
  function clearIncompatible(tr2, pos, parentType, match = parentType.contentMatch) {
    let node = tr2.doc.nodeAt(pos);
    let replSteps = [], cur = pos + 1;
    for (let i = 0; i < node.childCount; i++) {
      let child = node.child(i), end = cur + child.nodeSize;
      let allowed = match.matchType(child.type);
      if (!allowed) {
        replSteps.push(new ReplaceStep(cur, end, Slice.empty));
      } else {
        match = allowed;
        for (let j = 0; j < child.marks.length; j++)
          if (!parentType.allowsMarkType(child.marks[j].type))
            tr2.step(new RemoveMarkStep(cur, end, child.marks[j]));
        if (child.isText && !parentType.spec.code) {
          let m, newline = /\r?\n|\r/g, slice;
          while (m = newline.exec(child.text)) {
            if (!slice)
              slice = new Slice(Fragment.from(parentType.schema.text(" ", parentType.allowedMarks(child.marks))), 0, 0);
            replSteps.push(new ReplaceStep(cur + m.index, cur + m.index + m[0].length, slice));
          }
        }
      }
      cur = end;
    }
    if (!match.validEnd) {
      let fill = match.fillBefore(Fragment.empty, true);
      tr2.replace(cur, cur, new Slice(fill, 0, 0));
    }
    for (let i = replSteps.length - 1; i >= 0; i--)
      tr2.step(replSteps[i]);
  }
  function canCut(node, start, end) {
    return (start == 0 || node.canReplace(start, node.childCount)) && (end == node.childCount || node.canReplace(0, end));
  }
  function liftTarget(range) {
    let parent = range.parent;
    let content = parent.content.cutByIndex(range.startIndex, range.endIndex);
    for (let depth = range.depth; ; --depth) {
      let node = range.$from.node(depth);
      let index = range.$from.index(depth), endIndex = range.$to.indexAfter(depth);
      if (depth < range.depth && node.canReplace(index, endIndex, content))
        return depth;
      if (depth == 0 || node.type.spec.isolating || !canCut(node, index, endIndex))
        break;
    }
    return null;
  }
  function lift(tr2, range, target) {
    let { $from, $to, depth } = range;
    let gapStart = $from.before(depth + 1), gapEnd = $to.after(depth + 1);
    let start = gapStart, end = gapEnd;
    let before = Fragment.empty, openStart = 0;
    for (let d = depth, splitting = false; d > target; d--)
      if (splitting || $from.index(d) > 0) {
        splitting = true;
        before = Fragment.from($from.node(d).copy(before));
        openStart++;
      } else {
        start--;
      }
    let after = Fragment.empty, openEnd = 0;
    for (let d = depth, splitting = false; d > target; d--)
      if (splitting || $to.after(d + 1) < $to.end(d)) {
        splitting = true;
        after = Fragment.from($to.node(d).copy(after));
        openEnd++;
      } else {
        end++;
      }
    tr2.step(new ReplaceAroundStep(start, end, gapStart, gapEnd, new Slice(before.append(after), openStart, openEnd), before.size - openStart, true));
  }
  function findWrapping(range, nodeType, attrs = null, innerRange = range) {
    let around = findWrappingOutside(range, nodeType);
    let inner = around && findWrappingInside(innerRange, nodeType);
    if (!inner)
      return null;
    return around.map(withAttrs).concat({ type: nodeType, attrs }).concat(inner.map(withAttrs));
  }
  function withAttrs(type) {
    return { type, attrs: null };
  }
  function findWrappingOutside(range, type) {
    let { parent, startIndex, endIndex } = range;
    let around = parent.contentMatchAt(startIndex).findWrapping(type);
    if (!around)
      return null;
    let outer = around.length ? around[0] : type;
    return parent.canReplaceWith(startIndex, endIndex, outer) ? around : null;
  }
  function findWrappingInside(range, type) {
    let { parent, startIndex, endIndex } = range;
    let inner = parent.child(startIndex);
    let inside = type.contentMatch.findWrapping(inner.type);
    if (!inside)
      return null;
    let lastType = inside.length ? inside[inside.length - 1] : type;
    let innerMatch = lastType.contentMatch;
    for (let i = startIndex; innerMatch && i < endIndex; i++)
      innerMatch = innerMatch.matchType(parent.child(i).type);
    if (!innerMatch || !innerMatch.validEnd)
      return null;
    return inside;
  }
  function wrap(tr2, range, wrappers) {
    let content = Fragment.empty;
    for (let i = wrappers.length - 1; i >= 0; i--) {
      if (content.size) {
        let match = wrappers[i].type.contentMatch.matchFragment(content);
        if (!match || !match.validEnd)
          throw new RangeError("Wrapper type given to Transform.wrap does not form valid content of its parent wrapper");
      }
      content = Fragment.from(wrappers[i].type.create(wrappers[i].attrs, content));
    }
    let start = range.start, end = range.end;
    tr2.step(new ReplaceAroundStep(start, end, start, end, new Slice(content, 0, 0), wrappers.length, true));
  }
  function setBlockType(tr2, from, to, type, attrs) {
    if (!type.isTextblock)
      throw new RangeError("Type given to setBlockType should be a textblock");
    let mapFrom = tr2.steps.length;
    tr2.doc.nodesBetween(from, to, (node, pos) => {
      if (node.isTextblock && !node.hasMarkup(type, attrs) && canChangeType(tr2.doc, tr2.mapping.slice(mapFrom).map(pos), type)) {
        tr2.clearIncompatible(tr2.mapping.slice(mapFrom).map(pos, 1), type);
        let mapping = tr2.mapping.slice(mapFrom);
        let startM = mapping.map(pos, 1), endM = mapping.map(pos + node.nodeSize, 1);
        tr2.step(new ReplaceAroundStep(startM, endM, startM + 1, endM - 1, new Slice(Fragment.from(type.create(attrs, null, node.marks)), 0, 0), 1, true));
        return false;
      }
    });
  }
  function canChangeType(doc, pos, type) {
    let $pos = doc.resolve(pos), index = $pos.index();
    return $pos.parent.canReplaceWith(index, index + 1, type);
  }
  function setNodeMarkup(tr2, pos, type, attrs, marks) {
    let node = tr2.doc.nodeAt(pos);
    if (!node)
      throw new RangeError("No node at given position");
    if (!type)
      type = node.type;
    let newNode = type.create(attrs, null, marks || node.marks);
    if (node.isLeaf)
      return tr2.replaceWith(pos, pos + node.nodeSize, newNode);
    if (!type.validContent(node.content))
      throw new RangeError("Invalid content for node type " + type.name);
    tr2.step(new ReplaceAroundStep(pos, pos + node.nodeSize, pos + 1, pos + node.nodeSize - 1, new Slice(Fragment.from(newNode), 0, 0), 1, true));
  }
  function canSplit(doc, pos, depth = 1, typesAfter) {
    let $pos = doc.resolve(pos), base = $pos.depth - depth;
    let innerType = typesAfter && typesAfter[typesAfter.length - 1] || $pos.parent;
    if (base < 0 || $pos.parent.type.spec.isolating || !$pos.parent.canReplace($pos.index(), $pos.parent.childCount) || !innerType.type.validContent($pos.parent.content.cutByIndex($pos.index(), $pos.parent.childCount)))
      return false;
    for (let d = $pos.depth - 1, i = depth - 2; d > base; d--, i--) {
      let node = $pos.node(d), index2 = $pos.index(d);
      if (node.type.spec.isolating)
        return false;
      let rest = node.content.cutByIndex(index2, node.childCount);
      let overrideChild = typesAfter && typesAfter[i + 1];
      if (overrideChild)
        rest = rest.replaceChild(0, overrideChild.type.create(overrideChild.attrs));
      let after = typesAfter && typesAfter[i] || node;
      if (!node.canReplace(index2 + 1, node.childCount) || !after.type.validContent(rest))
        return false;
    }
    let index = $pos.indexAfter(base);
    let baseType = typesAfter && typesAfter[0];
    return $pos.node(base).canReplaceWith(index, index, baseType ? baseType.type : $pos.node(base + 1).type);
  }
  function split(tr2, pos, depth = 1, typesAfter) {
    let $pos = tr2.doc.resolve(pos), before = Fragment.empty, after = Fragment.empty;
    for (let d = $pos.depth, e = $pos.depth - depth, i = depth - 1; d > e; d--, i--) {
      before = Fragment.from($pos.node(d).copy(before));
      let typeAfter = typesAfter && typesAfter[i];
      after = Fragment.from(typeAfter ? typeAfter.type.create(typeAfter.attrs, after) : $pos.node(d).copy(after));
    }
    tr2.step(new ReplaceStep(pos, pos, new Slice(before.append(after), depth, depth), true));
  }
  function canJoin(doc, pos) {
    let $pos = doc.resolve(pos), index = $pos.index();
    return joinable2($pos.nodeBefore, $pos.nodeAfter) && $pos.parent.canReplace(index, index + 1);
  }
  function joinable2(a, b) {
    return !!(a && b && !a.isLeaf && a.canAppend(b));
  }
  function joinPoint(doc, pos, dir = -1) {
    let $pos = doc.resolve(pos);
    for (let d = $pos.depth; ; d--) {
      let before, after, index = $pos.index(d);
      if (d == $pos.depth) {
        before = $pos.nodeBefore;
        after = $pos.nodeAfter;
      } else if (dir > 0) {
        before = $pos.node(d + 1);
        index++;
        after = $pos.node(d).maybeChild(index);
      } else {
        before = $pos.node(d).maybeChild(index - 1);
        after = $pos.node(d + 1);
      }
      if (before && !before.isTextblock && joinable2(before, after) && $pos.node(d).canReplace(index, index + 1))
        return pos;
      if (d == 0)
        break;
      pos = dir < 0 ? $pos.before(d) : $pos.after(d);
    }
  }
  function join(tr2, pos, depth) {
    let step = new ReplaceStep(pos - depth, pos + depth, Slice.empty, true);
    tr2.step(step);
  }
  function insertPoint(doc, pos, nodeType) {
    let $pos = doc.resolve(pos);
    if ($pos.parent.canReplaceWith($pos.index(), $pos.index(), nodeType))
      return pos;
    if ($pos.parentOffset == 0)
      for (let d = $pos.depth - 1; d >= 0; d--) {
        let index = $pos.index(d);
        if ($pos.node(d).canReplaceWith(index, index, nodeType))
          return $pos.before(d + 1);
        if (index > 0)
          return null;
      }
    if ($pos.parentOffset == $pos.parent.content.size)
      for (let d = $pos.depth - 1; d >= 0; d--) {
        let index = $pos.indexAfter(d);
        if ($pos.node(d).canReplaceWith(index, index, nodeType))
          return $pos.after(d + 1);
        if (index < $pos.node(d).childCount)
          return null;
      }
    return null;
  }
  function replaceStep(doc, from, to = from, slice = Slice.empty) {
    if (from == to && !slice.size)
      return null;
    let $from = doc.resolve(from), $to = doc.resolve(to);
    if (fitsTrivially($from, $to, slice))
      return new ReplaceStep(from, to, slice);
    return new Fitter($from, $to, slice).fit();
  }
  function fitsTrivially($from, $to, slice) {
    return !slice.openStart && !slice.openEnd && $from.start() == $to.start() && $from.parent.canReplace($from.index(), $to.index(), slice.content);
  }
  var Fitter = class {
    constructor($from, $to, unplaced) {
      this.$from = $from;
      this.$to = $to;
      this.unplaced = unplaced;
      this.frontier = [];
      this.placed = Fragment.empty;
      for (let i = 0; i <= $from.depth; i++) {
        let node = $from.node(i);
        this.frontier.push({
          type: node.type,
          match: node.contentMatchAt($from.indexAfter(i))
        });
      }
      for (let i = $from.depth; i > 0; i--)
        this.placed = Fragment.from($from.node(i).copy(this.placed));
    }
    get depth() {
      return this.frontier.length - 1;
    }
    fit() {
      while (this.unplaced.size) {
        let fit = this.findFittable();
        if (fit)
          this.placeNodes(fit);
        else
          this.openMore() || this.dropNode();
      }
      let moveInline = this.mustMoveInline(), placedSize = this.placed.size - this.depth - this.$from.depth;
      let $from = this.$from, $to = this.close(moveInline < 0 ? this.$to : $from.doc.resolve(moveInline));
      if (!$to)
        return null;
      let content = this.placed, openStart = $from.depth, openEnd = $to.depth;
      while (openStart && openEnd && content.childCount == 1) {
        content = content.firstChild.content;
        openStart--;
        openEnd--;
      }
      let slice = new Slice(content, openStart, openEnd);
      if (moveInline > -1)
        return new ReplaceAroundStep($from.pos, moveInline, this.$to.pos, this.$to.end(), slice, placedSize);
      if (slice.size || $from.pos != this.$to.pos)
        return new ReplaceStep($from.pos, $to.pos, slice);
      return null;
    }
    // Find a position on the start spine of `this.unplaced` that has
    // content that can be moved somewhere on the frontier. Returns two
    // depths, one for the slice and one for the frontier.
    findFittable() {
      let startDepth = this.unplaced.openStart;
      for (let cur = this.unplaced.content, d = 0, openEnd = this.unplaced.openEnd; d < startDepth; d++) {
        let node = cur.firstChild;
        if (cur.childCount > 1)
          openEnd = 0;
        if (node.type.spec.isolating && openEnd <= d) {
          startDepth = d;
          break;
        }
        cur = node.content;
      }
      for (let pass = 1; pass <= 2; pass++) {
        for (let sliceDepth = pass == 1 ? startDepth : this.unplaced.openStart; sliceDepth >= 0; sliceDepth--) {
          let fragment, parent = null;
          if (sliceDepth) {
            parent = contentAt(this.unplaced.content, sliceDepth - 1).firstChild;
            fragment = parent.content;
          } else {
            fragment = this.unplaced.content;
          }
          let first2 = fragment.firstChild;
          for (let frontierDepth = this.depth; frontierDepth >= 0; frontierDepth--) {
            let { type, match } = this.frontier[frontierDepth], wrap2, inject = null;
            if (pass == 1 && (first2 ? match.matchType(first2.type) || (inject = match.fillBefore(Fragment.from(first2), false)) : parent && type.compatibleContent(parent.type)))
              return { sliceDepth, frontierDepth, parent, inject };
            else if (pass == 2 && first2 && (wrap2 = match.findWrapping(first2.type)))
              return { sliceDepth, frontierDepth, parent, wrap: wrap2 };
            if (parent && match.matchType(parent.type))
              break;
          }
        }
      }
    }
    openMore() {
      let { content, openStart, openEnd } = this.unplaced;
      let inner = contentAt(content, openStart);
      if (!inner.childCount || inner.firstChild.isLeaf)
        return false;
      this.unplaced = new Slice(content, openStart + 1, Math.max(openEnd, inner.size + openStart >= content.size - openEnd ? openStart + 1 : 0));
      return true;
    }
    dropNode() {
      let { content, openStart, openEnd } = this.unplaced;
      let inner = contentAt(content, openStart);
      if (inner.childCount <= 1 && openStart > 0) {
        let openAtEnd = content.size - openStart <= openStart + inner.size;
        this.unplaced = new Slice(dropFromFragment(content, openStart - 1, 1), openStart - 1, openAtEnd ? openStart - 1 : openEnd);
      } else {
        this.unplaced = new Slice(dropFromFragment(content, openStart, 1), openStart, openEnd);
      }
    }
    // Move content from the unplaced slice at `sliceDepth` to the
    // frontier node at `frontierDepth`. Close that frontier node when
    // applicable.
    placeNodes({ sliceDepth, frontierDepth, parent, inject, wrap: wrap2 }) {
      while (this.depth > frontierDepth)
        this.closeFrontierNode();
      if (wrap2)
        for (let i = 0; i < wrap2.length; i++)
          this.openFrontierNode(wrap2[i]);
      let slice = this.unplaced, fragment = parent ? parent.content : slice.content;
      let openStart = slice.openStart - sliceDepth;
      let taken = 0, add = [];
      let { match, type } = this.frontier[frontierDepth];
      if (inject) {
        for (let i = 0; i < inject.childCount; i++)
          add.push(inject.child(i));
        match = match.matchFragment(inject);
      }
      let openEndCount = fragment.size + sliceDepth - (slice.content.size - slice.openEnd);
      while (taken < fragment.childCount) {
        let next = fragment.child(taken), matches2 = match.matchType(next.type);
        if (!matches2)
          break;
        taken++;
        if (taken > 1 || openStart == 0 || next.content.size) {
          match = matches2;
          add.push(closeNodeStart(next.mark(type.allowedMarks(next.marks)), taken == 1 ? openStart : 0, taken == fragment.childCount ? openEndCount : -1));
        }
      }
      let toEnd = taken == fragment.childCount;
      if (!toEnd)
        openEndCount = -1;
      this.placed = addToFragment(this.placed, frontierDepth, Fragment.from(add));
      this.frontier[frontierDepth].match = match;
      if (toEnd && openEndCount < 0 && parent && parent.type == this.frontier[this.depth].type && this.frontier.length > 1)
        this.closeFrontierNode();
      for (let i = 0, cur = fragment; i < openEndCount; i++) {
        let node = cur.lastChild;
        this.frontier.push({ type: node.type, match: node.contentMatchAt(node.childCount) });
        cur = node.content;
      }
      this.unplaced = !toEnd ? new Slice(dropFromFragment(slice.content, sliceDepth, taken), slice.openStart, slice.openEnd) : sliceDepth == 0 ? Slice.empty : new Slice(dropFromFragment(slice.content, sliceDepth - 1, 1), sliceDepth - 1, openEndCount < 0 ? slice.openEnd : sliceDepth - 1);
    }
    mustMoveInline() {
      if (!this.$to.parent.isTextblock)
        return -1;
      let top = this.frontier[this.depth], level;
      if (!top.type.isTextblock || !contentAfterFits(this.$to, this.$to.depth, top.type, top.match, false) || this.$to.depth == this.depth && (level = this.findCloseLevel(this.$to)) && level.depth == this.depth)
        return -1;
      let { depth } = this.$to, after = this.$to.after(depth);
      while (depth > 1 && after == this.$to.end(--depth))
        ++after;
      return after;
    }
    findCloseLevel($to) {
      scan:
        for (let i = Math.min(this.depth, $to.depth); i >= 0; i--) {
          let { match, type } = this.frontier[i];
          let dropInner = i < $to.depth && $to.end(i + 1) == $to.pos + ($to.depth - (i + 1));
          let fit = contentAfterFits($to, i, type, match, dropInner);
          if (!fit)
            continue;
          for (let d = i - 1; d >= 0; d--) {
            let { match: match2, type: type2 } = this.frontier[d];
            let matches2 = contentAfterFits($to, d, type2, match2, true);
            if (!matches2 || matches2.childCount)
              continue scan;
          }
          return { depth: i, fit, move: dropInner ? $to.doc.resolve($to.after(i + 1)) : $to };
        }
    }
    close($to) {
      let close2 = this.findCloseLevel($to);
      if (!close2)
        return null;
      while (this.depth > close2.depth)
        this.closeFrontierNode();
      if (close2.fit.childCount)
        this.placed = addToFragment(this.placed, close2.depth, close2.fit);
      $to = close2.move;
      for (let d = close2.depth + 1; d <= $to.depth; d++) {
        let node = $to.node(d), add = node.type.contentMatch.fillBefore(node.content, true, $to.index(d));
        this.openFrontierNode(node.type, node.attrs, add);
      }
      return $to;
    }
    openFrontierNode(type, attrs = null, content) {
      let top = this.frontier[this.depth];
      top.match = top.match.matchType(type);
      this.placed = addToFragment(this.placed, this.depth, Fragment.from(type.create(attrs, content)));
      this.frontier.push({ type, match: type.contentMatch });
    }
    closeFrontierNode() {
      let open = this.frontier.pop();
      let add = open.match.fillBefore(Fragment.empty, true);
      if (add.childCount)
        this.placed = addToFragment(this.placed, this.frontier.length, add);
    }
  };
  function dropFromFragment(fragment, depth, count) {
    if (depth == 0)
      return fragment.cutByIndex(count, fragment.childCount);
    return fragment.replaceChild(0, fragment.firstChild.copy(dropFromFragment(fragment.firstChild.content, depth - 1, count)));
  }
  function addToFragment(fragment, depth, content) {
    if (depth == 0)
      return fragment.append(content);
    return fragment.replaceChild(fragment.childCount - 1, fragment.lastChild.copy(addToFragment(fragment.lastChild.content, depth - 1, content)));
  }
  function contentAt(fragment, depth) {
    for (let i = 0; i < depth; i++)
      fragment = fragment.firstChild.content;
    return fragment;
  }
  function closeNodeStart(node, openStart, openEnd) {
    if (openStart <= 0)
      return node;
    let frag = node.content;
    if (openStart > 1)
      frag = frag.replaceChild(0, closeNodeStart(frag.firstChild, openStart - 1, frag.childCount == 1 ? openEnd - 1 : 0));
    if (openStart > 0) {
      frag = node.type.contentMatch.fillBefore(frag).append(frag);
      if (openEnd <= 0)
        frag = frag.append(node.type.contentMatch.matchFragment(frag).fillBefore(Fragment.empty, true));
    }
    return node.copy(frag);
  }
  function contentAfterFits($to, depth, type, match, open) {
    let node = $to.node(depth), index = open ? $to.indexAfter(depth) : $to.index(depth);
    if (index == node.childCount && !type.compatibleContent(node.type))
      return null;
    let fit = match.fillBefore(node.content, true, index);
    return fit && !invalidMarks(type, node.content, index) ? fit : null;
  }
  function invalidMarks(type, fragment, start) {
    for (let i = start; i < fragment.childCount; i++)
      if (!type.allowsMarks(fragment.child(i).marks))
        return true;
    return false;
  }
  function definesContent(type) {
    return type.spec.defining || type.spec.definingForContent;
  }
  function replaceRange(tr2, from, to, slice) {
    if (!slice.size)
      return tr2.deleteRange(from, to);
    let $from = tr2.doc.resolve(from), $to = tr2.doc.resolve(to);
    if (fitsTrivially($from, $to, slice))
      return tr2.step(new ReplaceStep(from, to, slice));
    let targetDepths = coveredDepths($from, tr2.doc.resolve(to));
    if (targetDepths[targetDepths.length - 1] == 0)
      targetDepths.pop();
    let preferredTarget = -($from.depth + 1);
    targetDepths.unshift(preferredTarget);
    for (let d = $from.depth, pos = $from.pos - 1; d > 0; d--, pos--) {
      let spec = $from.node(d).type.spec;
      if (spec.defining || spec.definingAsContext || spec.isolating)
        break;
      if (targetDepths.indexOf(d) > -1)
        preferredTarget = d;
      else if ($from.before(d) == pos)
        targetDepths.splice(1, 0, -d);
    }
    let preferredTargetIndex = targetDepths.indexOf(preferredTarget);
    let leftNodes = [], preferredDepth = slice.openStart;
    for (let content = slice.content, i = 0; ; i++) {
      let node = content.firstChild;
      leftNodes.push(node);
      if (i == slice.openStart)
        break;
      content = node.content;
    }
    for (let d = preferredDepth - 1; d >= 0; d--) {
      let leftNode = leftNodes[d], def = definesContent(leftNode.type);
      if (def && !leftNode.sameMarkup($from.node(Math.abs(preferredTarget) - 1)))
        preferredDepth = d;
      else if (def || !leftNode.type.isTextblock)
        break;
    }
    for (let j = slice.openStart; j >= 0; j--) {
      let openDepth = (j + preferredDepth + 1) % (slice.openStart + 1);
      let insert = leftNodes[openDepth];
      if (!insert)
        continue;
      for (let i = 0; i < targetDepths.length; i++) {
        let targetDepth = targetDepths[(i + preferredTargetIndex) % targetDepths.length], expand = true;
        if (targetDepth < 0) {
          expand = false;
          targetDepth = -targetDepth;
        }
        let parent = $from.node(targetDepth - 1), index = $from.index(targetDepth - 1);
        if (parent.canReplaceWith(index, index, insert.type, insert.marks))
          return tr2.replace($from.before(targetDepth), expand ? $to.after(targetDepth) : to, new Slice(closeFragment(slice.content, 0, slice.openStart, openDepth), openDepth, slice.openEnd));
      }
    }
    let startSteps = tr2.steps.length;
    for (let i = targetDepths.length - 1; i >= 0; i--) {
      tr2.replace(from, to, slice);
      if (tr2.steps.length > startSteps)
        break;
      let depth = targetDepths[i];
      if (depth < 0)
        continue;
      from = $from.before(depth);
      to = $to.after(depth);
    }
  }
  function closeFragment(fragment, depth, oldOpen, newOpen, parent) {
    if (depth < oldOpen) {
      let first2 = fragment.firstChild;
      fragment = fragment.replaceChild(0, first2.copy(closeFragment(first2.content, depth + 1, oldOpen, newOpen, first2)));
    }
    if (depth > newOpen) {
      let match = parent.contentMatchAt(0);
      let start = match.fillBefore(fragment).append(fragment);
      fragment = start.append(match.matchFragment(start).fillBefore(Fragment.empty, true));
    }
    return fragment;
  }
  function replaceRangeWith(tr2, from, to, node) {
    if (!node.isInline && from == to && tr2.doc.resolve(from).parent.content.size) {
      let point = insertPoint(tr2.doc, from, node.type);
      if (point != null)
        from = to = point;
    }
    tr2.replaceRange(from, to, new Slice(Fragment.from(node), 0, 0));
  }
  function deleteRange(tr2, from, to) {
    let $from = tr2.doc.resolve(from), $to = tr2.doc.resolve(to);
    let covered = coveredDepths($from, $to);
    for (let i = 0; i < covered.length; i++) {
      let depth = covered[i], last = i == covered.length - 1;
      if (last && depth == 0 || $from.node(depth).type.contentMatch.validEnd)
        return tr2.delete($from.start(depth), $to.end(depth));
      if (depth > 0 && (last || $from.node(depth - 1).canReplace($from.index(depth - 1), $to.indexAfter(depth - 1))))
        return tr2.delete($from.before(depth), $to.after(depth));
    }
    for (let d = 1; d <= $from.depth && d <= $to.depth; d++) {
      if (from - $from.start(d) == $from.depth - d && to > $from.end(d) && $to.end(d) - to != $to.depth - d)
        return tr2.delete($from.before(d), to);
    }
    tr2.delete(from, to);
  }
  function coveredDepths($from, $to) {
    let result = [], minDepth = Math.min($from.depth, $to.depth);
    for (let d = minDepth; d >= 0; d--) {
      let start = $from.start(d);
      if (start < $from.pos - ($from.depth - d) || $to.end(d) > $to.pos + ($to.depth - d) || $from.node(d).type.spec.isolating || $to.node(d).type.spec.isolating)
        break;
      if (start == $to.start(d) || d == $from.depth && d == $to.depth && $from.parent.inlineContent && $to.parent.inlineContent && d && $to.start(d - 1) == start - 1)
        result.push(d);
    }
    return result;
  }
  var AttrStep = class _AttrStep extends Step {
    /**
    Construct an attribute step.
    */
    constructor(pos, attr, value) {
      super();
      this.pos = pos;
      this.attr = attr;
      this.value = value;
    }
    apply(doc) {
      let node = doc.nodeAt(this.pos);
      if (!node)
        return StepResult.fail("No node at attribute step's position");
      let attrs = /* @__PURE__ */ Object.create(null);
      for (let name in node.attrs)
        attrs[name] = node.attrs[name];
      attrs[this.attr] = this.value;
      let updated = node.type.create(attrs, null, node.marks);
      return StepResult.fromReplace(doc, this.pos, this.pos + 1, new Slice(Fragment.from(updated), 0, node.isLeaf ? 0 : 1));
    }
    getMap() {
      return StepMap.empty;
    }
    invert(doc) {
      return new _AttrStep(this.pos, this.attr, doc.nodeAt(this.pos).attrs[this.attr]);
    }
    map(mapping) {
      let pos = mapping.mapResult(this.pos, 1);
      return pos.deletedAfter ? null : new _AttrStep(pos.pos, this.attr, this.value);
    }
    toJSON() {
      return { stepType: "attr", pos: this.pos, attr: this.attr, value: this.value };
    }
    static fromJSON(schema, json) {
      if (typeof json.pos != "number" || typeof json.attr != "string")
        throw new RangeError("Invalid input for AttrStep.fromJSON");
      return new _AttrStep(json.pos, json.attr, json.value);
    }
  };
  Step.jsonID("attr", AttrStep);
  var DocAttrStep = class _DocAttrStep extends Step {
    /**
    Construct an attribute step.
    */
    constructor(attr, value) {
      super();
      this.attr = attr;
      this.value = value;
    }
    apply(doc) {
      let attrs = /* @__PURE__ */ Object.create(null);
      for (let name in doc.attrs)
        attrs[name] = doc.attrs[name];
      attrs[this.attr] = this.value;
      let updated = doc.type.create(attrs, doc.content, doc.marks);
      return StepResult.ok(updated);
    }
    getMap() {
      return StepMap.empty;
    }
    invert(doc) {
      return new _DocAttrStep(this.attr, doc.attrs[this.attr]);
    }
    map(mapping) {
      return this;
    }
    toJSON() {
      return { stepType: "docAttr", attr: this.attr, value: this.value };
    }
    static fromJSON(schema, json) {
      if (typeof json.attr != "string")
        throw new RangeError("Invalid input for DocAttrStep.fromJSON");
      return new _DocAttrStep(json.attr, json.value);
    }
  };
  Step.jsonID("docAttr", DocAttrStep);
  var TransformError = class extends Error {
  };
  TransformError = function TransformError2(message) {
    let err = Error.call(this, message);
    err.__proto__ = TransformError2.prototype;
    return err;
  };
  TransformError.prototype = Object.create(Error.prototype);
  TransformError.prototype.constructor = TransformError;
  TransformError.prototype.name = "TransformError";
  var Transform = class {
    /**
    Create a transform that starts with the given document.
    */
    constructor(doc) {
      this.doc = doc;
      this.steps = [];
      this.docs = [];
      this.mapping = new Mapping();
    }
    /**
    The starting document.
    */
    get before() {
      return this.docs.length ? this.docs[0] : this.doc;
    }
    /**
    Apply a new step in this transform, saving the result. Throws an
    error when the step fails.
    */
    step(step) {
      let result = this.maybeStep(step);
      if (result.failed)
        throw new TransformError(result.failed);
      return this;
    }
    /**
    Try to apply a step in this transformation, ignoring it if it
    fails. Returns the step result.
    */
    maybeStep(step) {
      let result = step.apply(this.doc);
      if (!result.failed)
        this.addStep(step, result.doc);
      return result;
    }
    /**
    True when the document has been changed (when there are any
    steps).
    */
    get docChanged() {
      return this.steps.length > 0;
    }
    /**
    @internal
    */
    addStep(step, doc) {
      this.docs.push(this.doc);
      this.steps.push(step);
      this.mapping.appendMap(step.getMap());
      this.doc = doc;
    }
    /**
    Replace the part of the document between `from` and `to` with the
    given `slice`.
    */
    replace(from, to = from, slice = Slice.empty) {
      let step = replaceStep(this.doc, from, to, slice);
      if (step)
        this.step(step);
      return this;
    }
    /**
    Replace the given range with the given content, which may be a
    fragment, node, or array of nodes.
    */
    replaceWith(from, to, content) {
      return this.replace(from, to, new Slice(Fragment.from(content), 0, 0));
    }
    /**
    Delete the content between the given positions.
    */
    delete(from, to) {
      return this.replace(from, to, Slice.empty);
    }
    /**
    Insert the given content at the given position.
    */
    insert(pos, content) {
      return this.replaceWith(pos, pos, content);
    }
    /**
    Replace a range of the document with a given slice, using
    `from`, `to`, and the slice's
    [`openStart`](https://prosemirror.net/docs/ref/#model.Slice.openStart) property as hints, rather
    than fixed start and end points. This method may grow the
    replaced area or close open nodes in the slice in order to get a
    fit that is more in line with WYSIWYG expectations, by dropping
    fully covered parent nodes of the replaced region when they are
    marked [non-defining as
    context](https://prosemirror.net/docs/ref/#model.NodeSpec.definingAsContext), or including an
    open parent node from the slice that _is_ marked as [defining
    its content](https://prosemirror.net/docs/ref/#model.NodeSpec.definingForContent).
    
    This is the method, for example, to handle paste. The similar
    [`replace`](https://prosemirror.net/docs/ref/#transform.Transform.replace) method is a more
    primitive tool which will _not_ move the start and end of its given
    range, and is useful in situations where you need more precise
    control over what happens.
    */
    replaceRange(from, to, slice) {
      replaceRange(this, from, to, slice);
      return this;
    }
    /**
    Replace the given range with a node, but use `from` and `to` as
    hints, rather than precise positions. When from and to are the same
    and are at the start or end of a parent node in which the given
    node doesn't fit, this method may _move_ them out towards a parent
    that does allow the given node to be placed. When the given range
    completely covers a parent node, this method may completely replace
    that parent node.
    */
    replaceRangeWith(from, to, node) {
      replaceRangeWith(this, from, to, node);
      return this;
    }
    /**
    Delete the given range, expanding it to cover fully covered
    parent nodes until a valid replace is found.
    */
    deleteRange(from, to) {
      deleteRange(this, from, to);
      return this;
    }
    /**
    Split the content in the given range off from its parent, if there
    is sibling content before or after it, and move it up the tree to
    the depth specified by `target`. You'll probably want to use
    [`liftTarget`](https://prosemirror.net/docs/ref/#transform.liftTarget) to compute `target`, to make
    sure the lift is valid.
    */
    lift(range, target) {
      lift(this, range, target);
      return this;
    }
    /**
    Join the blocks around the given position. If depth is 2, their
    last and first siblings are also joined, and so on.
    */
    join(pos, depth = 1) {
      join(this, pos, depth);
      return this;
    }
    /**
    Wrap the given [range](https://prosemirror.net/docs/ref/#model.NodeRange) in the given set of wrappers.
    The wrappers are assumed to be valid in this position, and should
    probably be computed with [`findWrapping`](https://prosemirror.net/docs/ref/#transform.findWrapping).
    */
    wrap(range, wrappers) {
      wrap(this, range, wrappers);
      return this;
    }
    /**
    Set the type of all textblocks (partly) between `from` and `to` to
    the given node type with the given attributes.
    */
    setBlockType(from, to = from, type, attrs = null) {
      setBlockType(this, from, to, type, attrs);
      return this;
    }
    /**
    Change the type, attributes, and/or marks of the node at `pos`.
    When `type` isn't given, the existing node type is preserved,
    */
    setNodeMarkup(pos, type, attrs = null, marks) {
      setNodeMarkup(this, pos, type, attrs, marks);
      return this;
    }
    /**
    Set a single attribute on a given node to a new value.
    The `pos` addresses the document content. Use `setDocAttribute`
    to set attributes on the document itself.
    */
    setNodeAttribute(pos, attr, value) {
      this.step(new AttrStep(pos, attr, value));
      return this;
    }
    /**
    Set a single attribute on the document to a new value.
    */
    setDocAttribute(attr, value) {
      this.step(new DocAttrStep(attr, value));
      return this;
    }
    /**
    Add a mark to the node at position `pos`.
    */
    addNodeMark(pos, mark) {
      this.step(new AddNodeMarkStep(pos, mark));
      return this;
    }
    /**
    Remove a mark (or a mark of the given type) from the node at
    position `pos`.
    */
    removeNodeMark(pos, mark) {
      if (!(mark instanceof Mark)) {
        let node = this.doc.nodeAt(pos);
        if (!node)
          throw new RangeError("No node at position " + pos);
        mark = mark.isInSet(node.marks);
        if (!mark)
          return this;
      }
      this.step(new RemoveNodeMarkStep(pos, mark));
      return this;
    }
    /**
    Split the node at the given position, and optionally, if `depth` is
    greater than one, any number of nodes above that. By default, the
    parts split off will inherit the node type of the original node.
    This can be changed by passing an array of types and attributes to
    use after the split.
    */
    split(pos, depth = 1, typesAfter) {
      split(this, pos, depth, typesAfter);
      return this;
    }
    /**
    Add the given mark to the inline content between `from` and `to`.
    */
    addMark(from, to, mark) {
      addMark(this, from, to, mark);
      return this;
    }
    /**
    Remove marks from inline nodes between `from` and `to`. When
    `mark` is a single mark, remove precisely that mark. When it is
    a mark type, remove all marks of that type. When it is null,
    remove all marks of any type.
    */
    removeMark(from, to, mark) {
      removeMark(this, from, to, mark);
      return this;
    }
    /**
    Removes all marks and nodes from the content of the node at
    `pos` that don't match the given new parent node type. Accepts
    an optional starting [content match](https://prosemirror.net/docs/ref/#model.ContentMatch) as
    third argument.
    */
    clearIncompatible(pos, parentType, match) {
      clearIncompatible(this, pos, parentType, match);
      return this;
    }
  };

  // node_modules/prosemirror-state/dist/index.js
  var classesById = /* @__PURE__ */ Object.create(null);
  var Selection = class {
    /**
    Initialize a selection with the head and anchor and ranges. If no
    ranges are given, constructs a single range across `$anchor` and
    `$head`.
    */
    constructor($anchor, $head, ranges) {
      this.$anchor = $anchor;
      this.$head = $head;
      this.ranges = ranges || [new SelectionRange($anchor.min($head), $anchor.max($head))];
    }
    /**
    The selection's anchor, as an unresolved position.
    */
    get anchor() {
      return this.$anchor.pos;
    }
    /**
    The selection's head.
    */
    get head() {
      return this.$head.pos;
    }
    /**
    The lower bound of the selection's main range.
    */
    get from() {
      return this.$from.pos;
    }
    /**
    The upper bound of the selection's main range.
    */
    get to() {
      return this.$to.pos;
    }
    /**
    The resolved lower  bound of the selection's main range.
    */
    get $from() {
      return this.ranges[0].$from;
    }
    /**
    The resolved upper bound of the selection's main range.
    */
    get $to() {
      return this.ranges[0].$to;
    }
    /**
    Indicates whether the selection contains any content.
    */
    get empty() {
      let ranges = this.ranges;
      for (let i = 0; i < ranges.length; i++)
        if (ranges[i].$from.pos != ranges[i].$to.pos)
          return false;
      return true;
    }
    /**
    Get the content of this selection as a slice.
    */
    content() {
      return this.$from.doc.slice(this.from, this.to, true);
    }
    /**
    Replace the selection with a slice or, if no slice is given,
    delete the selection. Will append to the given transaction.
    */
    replace(tr2, content = Slice.empty) {
      let lastNode = content.content.lastChild, lastParent = null;
      for (let i = 0; i < content.openEnd; i++) {
        lastParent = lastNode;
        lastNode = lastNode.lastChild;
      }
      let mapFrom = tr2.steps.length, ranges = this.ranges;
      for (let i = 0; i < ranges.length; i++) {
        let { $from, $to } = ranges[i], mapping = tr2.mapping.slice(mapFrom);
        tr2.replaceRange(mapping.map($from.pos), mapping.map($to.pos), i ? Slice.empty : content);
        if (i == 0)
          selectionToInsertionEnd(tr2, mapFrom, (lastNode ? lastNode.isInline : lastParent && lastParent.isTextblock) ? -1 : 1);
      }
    }
    /**
    Replace the selection with the given node, appending the changes
    to the given transaction.
    */
    replaceWith(tr2, node) {
      let mapFrom = tr2.steps.length, ranges = this.ranges;
      for (let i = 0; i < ranges.length; i++) {
        let { $from, $to } = ranges[i], mapping = tr2.mapping.slice(mapFrom);
        let from = mapping.map($from.pos), to = mapping.map($to.pos);
        if (i) {
          tr2.deleteRange(from, to);
        } else {
          tr2.replaceRangeWith(from, to, node);
          selectionToInsertionEnd(tr2, mapFrom, node.isInline ? -1 : 1);
        }
      }
    }
    /**
    Find a valid cursor or leaf node selection starting at the given
    position and searching back if `dir` is negative, and forward if
    positive. When `textOnly` is true, only consider cursor
    selections. Will return null when no valid selection position is
    found.
    */
    static findFrom($pos, dir, textOnly = false) {
      let inner = $pos.parent.inlineContent ? new TextSelection($pos) : findSelectionIn($pos.node(0), $pos.parent, $pos.pos, $pos.index(), dir, textOnly);
      if (inner)
        return inner;
      for (let depth = $pos.depth - 1; depth >= 0; depth--) {
        let found2 = dir < 0 ? findSelectionIn($pos.node(0), $pos.node(depth), $pos.before(depth + 1), $pos.index(depth), dir, textOnly) : findSelectionIn($pos.node(0), $pos.node(depth), $pos.after(depth + 1), $pos.index(depth) + 1, dir, textOnly);
        if (found2)
          return found2;
      }
      return null;
    }
    /**
    Find a valid cursor or leaf node selection near the given
    position. Searches forward first by default, but if `bias` is
    negative, it will search backwards first.
    */
    static near($pos, bias = 1) {
      return this.findFrom($pos, bias) || this.findFrom($pos, -bias) || new AllSelection($pos.node(0));
    }
    /**
    Find the cursor or leaf node selection closest to the start of
    the given document. Will return an
    [`AllSelection`](https://prosemirror.net/docs/ref/#state.AllSelection) if no valid position
    exists.
    */
    static atStart(doc) {
      return findSelectionIn(doc, doc, 0, 0, 1) || new AllSelection(doc);
    }
    /**
    Find the cursor or leaf node selection closest to the end of the
    given document.
    */
    static atEnd(doc) {
      return findSelectionIn(doc, doc, doc.content.size, doc.childCount, -1) || new AllSelection(doc);
    }
    /**
    Deserialize the JSON representation of a selection. Must be
    implemented for custom classes (as a static class method).
    */
    static fromJSON(doc, json) {
      if (!json || !json.type)
        throw new RangeError("Invalid input for Selection.fromJSON");
      let cls = classesById[json.type];
      if (!cls)
        throw new RangeError(`No selection type ${json.type} defined`);
      return cls.fromJSON(doc, json);
    }
    /**
    To be able to deserialize selections from JSON, custom selection
    classes must register themselves with an ID string, so that they
    can be disambiguated. Try to pick something that's unlikely to
    clash with classes from other modules.
    */
    static jsonID(id, selectionClass) {
      if (id in classesById)
        throw new RangeError("Duplicate use of selection JSON ID " + id);
      classesById[id] = selectionClass;
      selectionClass.prototype.jsonID = id;
      return selectionClass;
    }
    /**
    Get a [bookmark](https://prosemirror.net/docs/ref/#state.SelectionBookmark) for this selection,
    which is a value that can be mapped without having access to a
    current document, and later resolved to a real selection for a
    given document again. (This is used mostly by the history to
    track and restore old selections.) The default implementation of
    this method just converts the selection to a text selection and
    returns the bookmark for that.
    */
    getBookmark() {
      return TextSelection.between(this.$anchor, this.$head).getBookmark();
    }
  };
  Selection.prototype.visible = true;
  var SelectionRange = class {
    /**
    Create a range.
    */
    constructor($from, $to) {
      this.$from = $from;
      this.$to = $to;
    }
  };
  var warnedAboutTextSelection = false;
  function checkTextSelection($pos) {
    if (!warnedAboutTextSelection && !$pos.parent.inlineContent) {
      warnedAboutTextSelection = true;
      console["warn"]("TextSelection endpoint not pointing into a node with inline content (" + $pos.parent.type.name + ")");
    }
  }
  var TextSelection = class _TextSelection extends Selection {
    /**
    Construct a text selection between the given points.
    */
    constructor($anchor, $head = $anchor) {
      checkTextSelection($anchor);
      checkTextSelection($head);
      super($anchor, $head);
    }
    /**
    Returns a resolved position if this is a cursor selection (an
    empty text selection), and null otherwise.
    */
    get $cursor() {
      return this.$anchor.pos == this.$head.pos ? this.$head : null;
    }
    map(doc, mapping) {
      let $head = doc.resolve(mapping.map(this.head));
      if (!$head.parent.inlineContent)
        return Selection.near($head);
      let $anchor = doc.resolve(mapping.map(this.anchor));
      return new _TextSelection($anchor.parent.inlineContent ? $anchor : $head, $head);
    }
    replace(tr2, content = Slice.empty) {
      super.replace(tr2, content);
      if (content == Slice.empty) {
        let marks = this.$from.marksAcross(this.$to);
        if (marks)
          tr2.ensureMarks(marks);
      }
    }
    eq(other) {
      return other instanceof _TextSelection && other.anchor == this.anchor && other.head == this.head;
    }
    getBookmark() {
      return new TextBookmark(this.anchor, this.head);
    }
    toJSON() {
      return { type: "text", anchor: this.anchor, head: this.head };
    }
    /**
    @internal
    */
    static fromJSON(doc, json) {
      if (typeof json.anchor != "number" || typeof json.head != "number")
        throw new RangeError("Invalid input for TextSelection.fromJSON");
      return new _TextSelection(doc.resolve(json.anchor), doc.resolve(json.head));
    }
    /**
    Create a text selection from non-resolved positions.
    */
    static create(doc, anchor, head = anchor) {
      let $anchor = doc.resolve(anchor);
      return new this($anchor, head == anchor ? $anchor : doc.resolve(head));
    }
    /**
    Return a text selection that spans the given positions or, if
    they aren't text positions, find a text selection near them.
    `bias` determines whether the method searches forward (default)
    or backwards (negative number) first. Will fall back to calling
    [`Selection.near`](https://prosemirror.net/docs/ref/#state.Selection^near) when the document
    doesn't contain a valid text position.
    */
    static between($anchor, $head, bias) {
      let dPos = $anchor.pos - $head.pos;
      if (!bias || dPos)
        bias = dPos >= 0 ? 1 : -1;
      if (!$head.parent.inlineContent) {
        let found2 = Selection.findFrom($head, bias, true) || Selection.findFrom($head, -bias, true);
        if (found2)
          $head = found2.$head;
        else
          return Selection.near($head, bias);
      }
      if (!$anchor.parent.inlineContent) {
        if (dPos == 0) {
          $anchor = $head;
        } else {
          $anchor = (Selection.findFrom($anchor, -bias, true) || Selection.findFrom($anchor, bias, true)).$anchor;
          if ($anchor.pos < $head.pos != dPos < 0)
            $anchor = $head;
        }
      }
      return new _TextSelection($anchor, $head);
    }
  };
  Selection.jsonID("text", TextSelection);
  var TextBookmark = class _TextBookmark {
    constructor(anchor, head) {
      this.anchor = anchor;
      this.head = head;
    }
    map(mapping) {
      return new _TextBookmark(mapping.map(this.anchor), mapping.map(this.head));
    }
    resolve(doc) {
      return TextSelection.between(doc.resolve(this.anchor), doc.resolve(this.head));
    }
  };
  var NodeSelection = class _NodeSelection extends Selection {
    /**
    Create a node selection. Does not verify the validity of its
    argument.
    */
    constructor($pos) {
      let node = $pos.nodeAfter;
      let $end = $pos.node(0).resolve($pos.pos + node.nodeSize);
      super($pos, $end);
      this.node = node;
    }
    map(doc, mapping) {
      let { deleted, pos } = mapping.mapResult(this.anchor);
      let $pos = doc.resolve(pos);
      if (deleted)
        return Selection.near($pos);
      return new _NodeSelection($pos);
    }
    content() {
      return new Slice(Fragment.from(this.node), 0, 0);
    }
    eq(other) {
      return other instanceof _NodeSelection && other.anchor == this.anchor;
    }
    toJSON() {
      return { type: "node", anchor: this.anchor };
    }
    getBookmark() {
      return new NodeBookmark(this.anchor);
    }
    /**
    @internal
    */
    static fromJSON(doc, json) {
      if (typeof json.anchor != "number")
        throw new RangeError("Invalid input for NodeSelection.fromJSON");
      return new _NodeSelection(doc.resolve(json.anchor));
    }
    /**
    Create a node selection from non-resolved positions.
    */
    static create(doc, from) {
      return new _NodeSelection(doc.resolve(from));
    }
    /**
    Determines whether the given node may be selected as a node
    selection.
    */
    static isSelectable(node) {
      return !node.isText && node.type.spec.selectable !== false;
    }
  };
  NodeSelection.prototype.visible = false;
  Selection.jsonID("node", NodeSelection);
  var NodeBookmark = class _NodeBookmark {
    constructor(anchor) {
      this.anchor = anchor;
    }
    map(mapping) {
      let { deleted, pos } = mapping.mapResult(this.anchor);
      return deleted ? new TextBookmark(pos, pos) : new _NodeBookmark(pos);
    }
    resolve(doc) {
      let $pos = doc.resolve(this.anchor), node = $pos.nodeAfter;
      if (node && NodeSelection.isSelectable(node))
        return new NodeSelection($pos);
      return Selection.near($pos);
    }
  };
  var AllSelection = class _AllSelection extends Selection {
    /**
    Create an all-selection over the given document.
    */
    constructor(doc) {
      super(doc.resolve(0), doc.resolve(doc.content.size));
    }
    replace(tr2, content = Slice.empty) {
      if (content == Slice.empty) {
        tr2.delete(0, tr2.doc.content.size);
        let sel = Selection.atStart(tr2.doc);
        if (!sel.eq(tr2.selection))
          tr2.setSelection(sel);
      } else {
        super.replace(tr2, content);
      }
    }
    toJSON() {
      return { type: "all" };
    }
    /**
    @internal
    */
    static fromJSON(doc) {
      return new _AllSelection(doc);
    }
    map(doc) {
      return new _AllSelection(doc);
    }
    eq(other) {
      return other instanceof _AllSelection;
    }
    getBookmark() {
      return AllBookmark;
    }
  };
  Selection.jsonID("all", AllSelection);
  var AllBookmark = {
    map() {
      return this;
    },
    resolve(doc) {
      return new AllSelection(doc);
    }
  };
  function findSelectionIn(doc, node, pos, index, dir, text = false) {
    if (node.inlineContent)
      return TextSelection.create(doc, pos);
    for (let i = index - (dir > 0 ? 0 : 1); dir > 0 ? i < node.childCount : i >= 0; i += dir) {
      let child = node.child(i);
      if (!child.isAtom) {
        let inner = findSelectionIn(doc, child, pos + dir, dir < 0 ? child.childCount : 0, dir, text);
        if (inner)
          return inner;
      } else if (!text && NodeSelection.isSelectable(child)) {
        return NodeSelection.create(doc, pos - (dir < 0 ? child.nodeSize : 0));
      }
      pos += child.nodeSize * dir;
    }
    return null;
  }
  function selectionToInsertionEnd(tr2, startLen, bias) {
    let last = tr2.steps.length - 1;
    if (last < startLen)
      return;
    let step = tr2.steps[last];
    if (!(step instanceof ReplaceStep || step instanceof ReplaceAroundStep))
      return;
    let map = tr2.mapping.maps[last], end;
    map.forEach((_from, _to, _newFrom, newTo) => {
      if (end == null)
        end = newTo;
    });
    tr2.setSelection(Selection.near(tr2.doc.resolve(end), bias));
  }
  function bind(f, self) {
    return !self || !f ? f : f.bind(self);
  }
  var FieldDesc = class {
    constructor(name, desc, self) {
      this.name = name;
      this.init = bind(desc.init, self);
      this.apply = bind(desc.apply, self);
    }
  };
  var baseFields = [
    new FieldDesc("doc", {
      init(config) {
        return config.doc || config.schema.topNodeType.createAndFill();
      },
      apply(tr2) {
        return tr2.doc;
      }
    }),
    new FieldDesc("selection", {
      init(config, instance) {
        return config.selection || Selection.atStart(instance.doc);
      },
      apply(tr2) {
        return tr2.selection;
      }
    }),
    new FieldDesc("storedMarks", {
      init(config) {
        return config.storedMarks || null;
      },
      apply(tr2, _marks, _old, state) {
        return state.selection.$cursor ? tr2.storedMarks : null;
      }
    }),
    new FieldDesc("scrollToSelection", {
      init() {
        return 0;
      },
      apply(tr2, prev) {
        return tr2.scrolledIntoView ? prev + 1 : prev;
      }
    })
  ];
  function bindProps(obj, self, target) {
    for (let prop in obj) {
      let val = obj[prop];
      if (val instanceof Function)
        val = val.bind(self);
      else if (prop == "handleDOMEvents")
        val = bindProps(val, self, {});
      target[prop] = val;
    }
    return target;
  }
  var Plugin = class {
    /**
    Create a plugin.
    */
    constructor(spec) {
      this.spec = spec;
      this.props = {};
      if (spec.props)
        bindProps(spec.props, this, this.props);
      this.key = spec.key ? spec.key.key : createKey("plugin");
    }
    /**
    Extract the plugin's state field from an editor state.
    */
    getState(state) {
      return state[this.key];
    }
  };
  var keys = /* @__PURE__ */ Object.create(null);
  function createKey(name) {
    if (name in keys)
      return name + "$" + ++keys[name];
    keys[name] = 0;
    return name + "$";
  }
  var PluginKey = class {
    /**
    Create a plugin key.
    */
    constructor(name = "key") {
      this.key = createKey(name);
    }
    /**
    Get the active plugin with this key, if any, from an editor
    state.
    */
    get(state) {
      return state.config.pluginsByKey[this.key];
    }
    /**
    Get the plugin's state from an editor state.
    */
    getState(state) {
      return state[this.key];
    }
  };

  // node_modules/prosemirror-commands/dist/index.js
  var deleteSelection = (state, dispatch) => {
    if (state.selection.empty)
      return false;
    if (dispatch)
      dispatch(state.tr.deleteSelection().scrollIntoView());
    return true;
  };
  function atBlockStart(state, view) {
    let { $cursor } = state.selection;
    if (!$cursor || (view ? !view.endOfTextblock("backward", state) : $cursor.parentOffset > 0))
      return null;
    return $cursor;
  }
  var joinBackward = (state, dispatch, view) => {
    let $cursor = atBlockStart(state, view);
    if (!$cursor)
      return false;
    let $cut = findCutBefore($cursor);
    if (!$cut) {
      let range = $cursor.blockRange(), target = range && liftTarget(range);
      if (target == null)
        return false;
      if (dispatch)
        dispatch(state.tr.lift(range, target).scrollIntoView());
      return true;
    }
    let before = $cut.nodeBefore;
    if (!before.type.spec.isolating && deleteBarrier(state, $cut, dispatch))
      return true;
    if ($cursor.parent.content.size == 0 && (textblockAt(before, "end") || NodeSelection.isSelectable(before))) {
      let delStep = replaceStep(state.doc, $cursor.before(), $cursor.after(), Slice.empty);
      if (delStep && delStep.slice.size < delStep.to - delStep.from) {
        if (dispatch) {
          let tr2 = state.tr.step(delStep);
          tr2.setSelection(textblockAt(before, "end") ? Selection.findFrom(tr2.doc.resolve(tr2.mapping.map($cut.pos, -1)), -1) : NodeSelection.create(tr2.doc, $cut.pos - before.nodeSize));
          dispatch(tr2.scrollIntoView());
        }
        return true;
      }
    }
    if (before.isAtom && $cut.depth == $cursor.depth - 1) {
      if (dispatch)
        dispatch(state.tr.delete($cut.pos - before.nodeSize, $cut.pos).scrollIntoView());
      return true;
    }
    return false;
  };
  function textblockAt(node, side, only = false) {
    for (let scan = node; scan; scan = side == "start" ? scan.firstChild : scan.lastChild) {
      if (scan.isTextblock)
        return true;
      if (only && scan.childCount != 1)
        return false;
    }
    return false;
  }
  var selectNodeBackward = (state, dispatch, view) => {
    let { $head, empty } = state.selection, $cut = $head;
    if (!empty)
      return false;
    if ($head.parent.isTextblock) {
      if (view ? !view.endOfTextblock("backward", state) : $head.parentOffset > 0)
        return false;
      $cut = findCutBefore($head);
    }
    let node = $cut && $cut.nodeBefore;
    if (!node || !NodeSelection.isSelectable(node))
      return false;
    if (dispatch)
      dispatch(state.tr.setSelection(NodeSelection.create(state.doc, $cut.pos - node.nodeSize)).scrollIntoView());
    return true;
  };
  function findCutBefore($pos) {
    if (!$pos.parent.type.spec.isolating)
      for (let i = $pos.depth - 1; i >= 0; i--) {
        if ($pos.index(i) > 0)
          return $pos.doc.resolve($pos.before(i + 1));
        if ($pos.node(i).type.spec.isolating)
          break;
      }
    return null;
  }
  function atBlockEnd(state, view) {
    let { $cursor } = state.selection;
    if (!$cursor || (view ? !view.endOfTextblock("forward", state) : $cursor.parentOffset < $cursor.parent.content.size))
      return null;
    return $cursor;
  }
  var joinForward = (state, dispatch, view) => {
    let $cursor = atBlockEnd(state, view);
    if (!$cursor)
      return false;
    let $cut = findCutAfter($cursor);
    if (!$cut)
      return false;
    let after = $cut.nodeAfter;
    if (deleteBarrier(state, $cut, dispatch))
      return true;
    if ($cursor.parent.content.size == 0 && (textblockAt(after, "start") || NodeSelection.isSelectable(after))) {
      let delStep = replaceStep(state.doc, $cursor.before(), $cursor.after(), Slice.empty);
      if (delStep && delStep.slice.size < delStep.to - delStep.from) {
        if (dispatch) {
          let tr2 = state.tr.step(delStep);
          tr2.setSelection(textblockAt(after, "start") ? Selection.findFrom(tr2.doc.resolve(tr2.mapping.map($cut.pos)), 1) : NodeSelection.create(tr2.doc, tr2.mapping.map($cut.pos)));
          dispatch(tr2.scrollIntoView());
        }
        return true;
      }
    }
    if (after.isAtom && $cut.depth == $cursor.depth - 1) {
      if (dispatch)
        dispatch(state.tr.delete($cut.pos, $cut.pos + after.nodeSize).scrollIntoView());
      return true;
    }
    return false;
  };
  var selectNodeForward = (state, dispatch, view) => {
    let { $head, empty } = state.selection, $cut = $head;
    if (!empty)
      return false;
    if ($head.parent.isTextblock) {
      if (view ? !view.endOfTextblock("forward", state) : $head.parentOffset < $head.parent.content.size)
        return false;
      $cut = findCutAfter($head);
    }
    let node = $cut && $cut.nodeAfter;
    if (!node || !NodeSelection.isSelectable(node))
      return false;
    if (dispatch)
      dispatch(state.tr.setSelection(NodeSelection.create(state.doc, $cut.pos)).scrollIntoView());
    return true;
  };
  function findCutAfter($pos) {
    if (!$pos.parent.type.spec.isolating)
      for (let i = $pos.depth - 1; i >= 0; i--) {
        let parent = $pos.node(i);
        if ($pos.index(i) + 1 < parent.childCount)
          return $pos.doc.resolve($pos.after(i + 1));
        if (parent.type.spec.isolating)
          break;
      }
    return null;
  }
  var joinUp = (state, dispatch) => {
    let sel = state.selection, nodeSel = sel instanceof NodeSelection, point;
    if (nodeSel) {
      if (sel.node.isTextblock || !canJoin(state.doc, sel.from))
        return false;
      point = sel.from;
    } else {
      point = joinPoint(state.doc, sel.from, -1);
      if (point == null)
        return false;
    }
    if (dispatch) {
      let tr2 = state.tr.join(point);
      if (nodeSel)
        tr2.setSelection(NodeSelection.create(tr2.doc, point - state.doc.resolve(point).nodeBefore.nodeSize));
      dispatch(tr2.scrollIntoView());
    }
    return true;
  };
  var joinDown = (state, dispatch) => {
    let sel = state.selection, point;
    if (sel instanceof NodeSelection) {
      if (sel.node.isTextblock || !canJoin(state.doc, sel.to))
        return false;
      point = sel.to;
    } else {
      point = joinPoint(state.doc, sel.to, 1);
      if (point == null)
        return false;
    }
    if (dispatch)
      dispatch(state.tr.join(point).scrollIntoView());
    return true;
  };
  var lift2 = (state, dispatch) => {
    let { $from, $to } = state.selection;
    let range = $from.blockRange($to), target = range && liftTarget(range);
    if (target == null)
      return false;
    if (dispatch)
      dispatch(state.tr.lift(range, target).scrollIntoView());
    return true;
  };
  var newlineInCode = (state, dispatch) => {
    let { $head, $anchor } = state.selection;
    if (!$head.parent.type.spec.code || !$head.sameParent($anchor))
      return false;
    if (dispatch)
      dispatch(state.tr.insertText("\n").scrollIntoView());
    return true;
  };
  function defaultBlockAt(match) {
    for (let i = 0; i < match.edgeCount; i++) {
      let { type } = match.edge(i);
      if (type.isTextblock && !type.hasRequiredAttrs())
        return type;
    }
    return null;
  }
  var exitCode = (state, dispatch) => {
    let { $head, $anchor } = state.selection;
    if (!$head.parent.type.spec.code || !$head.sameParent($anchor))
      return false;
    let above = $head.node(-1), after = $head.indexAfter(-1), type = defaultBlockAt(above.contentMatchAt(after));
    if (!type || !above.canReplaceWith(after, after, type))
      return false;
    if (dispatch) {
      let pos = $head.after(), tr2 = state.tr.replaceWith(pos, pos, type.createAndFill());
      tr2.setSelection(Selection.near(tr2.doc.resolve(pos), 1));
      dispatch(tr2.scrollIntoView());
    }
    return true;
  };
  var createParagraphNear = (state, dispatch) => {
    let sel = state.selection, { $from, $to } = sel;
    if (sel instanceof AllSelection || $from.parent.inlineContent || $to.parent.inlineContent)
      return false;
    let type = defaultBlockAt($to.parent.contentMatchAt($to.indexAfter()));
    if (!type || !type.isTextblock)
      return false;
    if (dispatch) {
      let side = (!$from.parentOffset && $to.index() < $to.parent.childCount ? $from : $to).pos;
      let tr2 = state.tr.insert(side, type.createAndFill());
      tr2.setSelection(TextSelection.create(tr2.doc, side + 1));
      dispatch(tr2.scrollIntoView());
    }
    return true;
  };
  var liftEmptyBlock = (state, dispatch) => {
    let { $cursor } = state.selection;
    if (!$cursor || $cursor.parent.content.size)
      return false;
    if ($cursor.depth > 1 && $cursor.after() != $cursor.end(-1)) {
      let before = $cursor.before();
      if (canSplit(state.doc, before)) {
        if (dispatch)
          dispatch(state.tr.split(before).scrollIntoView());
        return true;
      }
    }
    let range = $cursor.blockRange(), target = range && liftTarget(range);
    if (target == null)
      return false;
    if (dispatch)
      dispatch(state.tr.lift(range, target).scrollIntoView());
    return true;
  };
  function splitBlockAs(splitNode) {
    return (state, dispatch) => {
      let { $from, $to } = state.selection;
      if (state.selection instanceof NodeSelection && state.selection.node.isBlock) {
        if (!$from.parentOffset || !canSplit(state.doc, $from.pos))
          return false;
        if (dispatch)
          dispatch(state.tr.split($from.pos).scrollIntoView());
        return true;
      }
      if (!$from.parent.isBlock)
        return false;
      if (dispatch) {
        let atEnd = $to.parentOffset == $to.parent.content.size;
        let tr2 = state.tr;
        if (state.selection instanceof TextSelection || state.selection instanceof AllSelection)
          tr2.deleteSelection();
        let deflt = $from.depth == 0 ? null : defaultBlockAt($from.node(-1).contentMatchAt($from.indexAfter(-1)));
        let splitType = splitNode && splitNode($to.parent, atEnd);
        let types = splitType ? [splitType] : atEnd && deflt ? [{ type: deflt }] : void 0;
        let can = canSplit(tr2.doc, tr2.mapping.map($from.pos), 1, types);
        if (!types && !can && canSplit(tr2.doc, tr2.mapping.map($from.pos), 1, deflt ? [{ type: deflt }] : void 0)) {
          if (deflt)
            types = [{ type: deflt }];
          can = true;
        }
        if (can) {
          tr2.split(tr2.mapping.map($from.pos), 1, types);
          if (!atEnd && !$from.parentOffset && $from.parent.type != deflt) {
            let first2 = tr2.mapping.map($from.before()), $first = tr2.doc.resolve(first2);
            if (deflt && $from.node(-1).canReplaceWith($first.index(), $first.index() + 1, deflt))
              tr2.setNodeMarkup(tr2.mapping.map($from.before()), deflt);
          }
        }
        dispatch(tr2.scrollIntoView());
      }
      return true;
    };
  }
  var splitBlock = splitBlockAs();
  var selectParentNode = (state, dispatch) => {
    let { $from, to } = state.selection, pos;
    let same = $from.sharedDepth(to);
    if (same == 0)
      return false;
    pos = $from.before(same);
    if (dispatch)
      dispatch(state.tr.setSelection(NodeSelection.create(state.doc, pos)));
    return true;
  };
  var selectAll = (state, dispatch) => {
    if (dispatch)
      dispatch(state.tr.setSelection(new AllSelection(state.doc)));
    return true;
  };
  function joinMaybeClear(state, $pos, dispatch) {
    let before = $pos.nodeBefore, after = $pos.nodeAfter, index = $pos.index();
    if (!before || !after || !before.type.compatibleContent(after.type))
      return false;
    if (!before.content.size && $pos.parent.canReplace(index - 1, index)) {
      if (dispatch)
        dispatch(state.tr.delete($pos.pos - before.nodeSize, $pos.pos).scrollIntoView());
      return true;
    }
    if (!$pos.parent.canReplace(index, index + 1) || !(after.isTextblock || canJoin(state.doc, $pos.pos)))
      return false;
    if (dispatch)
      dispatch(state.tr.clearIncompatible($pos.pos, before.type, before.contentMatchAt(before.childCount)).join($pos.pos).scrollIntoView());
    return true;
  }
  function deleteBarrier(state, $cut, dispatch) {
    let before = $cut.nodeBefore, after = $cut.nodeAfter, conn, match;
    if (before.type.spec.isolating || after.type.spec.isolating)
      return false;
    if (joinMaybeClear(state, $cut, dispatch))
      return true;
    let canDelAfter = $cut.parent.canReplace($cut.index(), $cut.index() + 1);
    if (canDelAfter && (conn = (match = before.contentMatchAt(before.childCount)).findWrapping(after.type)) && match.matchType(conn[0] || after.type).validEnd) {
      if (dispatch) {
        let end = $cut.pos + after.nodeSize, wrap2 = Fragment.empty;
        for (let i = conn.length - 1; i >= 0; i--)
          wrap2 = Fragment.from(conn[i].create(null, wrap2));
        wrap2 = Fragment.from(before.copy(wrap2));
        let tr2 = state.tr.step(new ReplaceAroundStep($cut.pos - 1, end, $cut.pos, end, new Slice(wrap2, 1, 0), conn.length, true));
        let joinAt = end + 2 * conn.length;
        if (canJoin(tr2.doc, joinAt))
          tr2.join(joinAt);
        dispatch(tr2.scrollIntoView());
      }
      return true;
    }
    let selAfter = Selection.findFrom($cut, 1);
    let range = selAfter && selAfter.$from.blockRange(selAfter.$to), target = range && liftTarget(range);
    if (target != null && target >= $cut.depth) {
      if (dispatch)
        dispatch(state.tr.lift(range, target).scrollIntoView());
      return true;
    }
    if (canDelAfter && textblockAt(after, "start", true) && textblockAt(before, "end")) {
      let at = before, wrap2 = [];
      for (; ; ) {
        wrap2.push(at);
        if (at.isTextblock)
          break;
        at = at.lastChild;
      }
      let afterText = after, afterDepth = 1;
      for (; !afterText.isTextblock; afterText = afterText.firstChild)
        afterDepth++;
      if (at.canReplace(at.childCount, at.childCount, afterText.content)) {
        if (dispatch) {
          let end = Fragment.empty;
          for (let i = wrap2.length - 1; i >= 0; i--)
            end = Fragment.from(wrap2[i].copy(end));
          let tr2 = state.tr.step(new ReplaceAroundStep($cut.pos - wrap2.length, $cut.pos + after.nodeSize, $cut.pos + afterDepth, $cut.pos + after.nodeSize - afterDepth, new Slice(end, wrap2.length, 0), 0, true));
          dispatch(tr2.scrollIntoView());
        }
        return true;
      }
    }
    return false;
  }
  function selectTextblockSide(side) {
    return function(state, dispatch) {
      let sel = state.selection, $pos = side < 0 ? sel.$from : sel.$to;
      let depth = $pos.depth;
      while ($pos.node(depth).isInline) {
        if (!depth)
          return false;
        depth--;
      }
      if (!$pos.node(depth).isTextblock)
        return false;
      if (dispatch)
        dispatch(state.tr.setSelection(TextSelection.create(state.doc, side < 0 ? $pos.start(depth) : $pos.end(depth))));
      return true;
    };
  }
  var selectTextblockStart = selectTextblockSide(-1);
  var selectTextblockEnd = selectTextblockSide(1);
  function wrapIn(nodeType, attrs = null) {
    return function(state, dispatch) {
      let { $from, $to } = state.selection;
      let range = $from.blockRange($to), wrapping = range && findWrapping(range, nodeType, attrs);
      if (!wrapping)
        return false;
      if (dispatch)
        dispatch(state.tr.wrap(range, wrapping).scrollIntoView());
      return true;
    };
  }
  function setBlockType2(nodeType, attrs = null) {
    return function(state, dispatch) {
      let applicable = false;
      for (let i = 0; i < state.selection.ranges.length && !applicable; i++) {
        let { $from: { pos: from }, $to: { pos: to } } = state.selection.ranges[i];
        state.doc.nodesBetween(from, to, (node, pos) => {
          if (applicable)
            return false;
          if (!node.isTextblock || node.hasMarkup(nodeType, attrs))
            return;
          if (node.type == nodeType) {
            applicable = true;
          } else {
            let $pos = state.doc.resolve(pos), index = $pos.index();
            applicable = $pos.parent.canReplaceWith(index, index + 1, nodeType);
          }
        });
      }
      if (!applicable)
        return false;
      if (dispatch) {
        let tr2 = state.tr;
        for (let i = 0; i < state.selection.ranges.length; i++) {
          let { $from: { pos: from }, $to: { pos: to } } = state.selection.ranges[i];
          tr2.setBlockType(from, to, nodeType, attrs);
        }
        dispatch(tr2.scrollIntoView());
      }
      return true;
    };
  }
  function chainCommands(...commands2) {
    return function(state, dispatch, view) {
      for (let i = 0; i < commands2.length; i++)
        if (commands2[i](state, dispatch, view))
          return true;
      return false;
    };
  }
  var backspace = chainCommands(deleteSelection, joinBackward, selectNodeBackward);
  var del = chainCommands(deleteSelection, joinForward, selectNodeForward);
  var pcBaseKeymap = {
    "Enter": chainCommands(newlineInCode, createParagraphNear, liftEmptyBlock, splitBlock),
    "Mod-Enter": exitCode,
    "Backspace": backspace,
    "Mod-Backspace": backspace,
    "Shift-Backspace": backspace,
    "Delete": del,
    "Mod-Delete": del,
    "Mod-a": selectAll
  };
  var macBaseKeymap = {
    "Ctrl-h": pcBaseKeymap["Backspace"],
    "Alt-Backspace": pcBaseKeymap["Mod-Backspace"],
    "Ctrl-d": pcBaseKeymap["Delete"],
    "Ctrl-Alt-Backspace": pcBaseKeymap["Mod-Delete"],
    "Alt-Delete": pcBaseKeymap["Mod-Delete"],
    "Alt-d": pcBaseKeymap["Mod-Delete"],
    "Ctrl-a": selectTextblockStart,
    "Ctrl-e": selectTextblockEnd
  };
  for (let key in pcBaseKeymap)
    macBaseKeymap[key] = pcBaseKeymap[key];
  var mac = typeof navigator != "undefined" ? /Mac|iP(hone|[oa]d)/.test(navigator.platform) : typeof os != "undefined" && os.platform ? os.platform() == "darwin" : false;

  // node_modules/prosemirror-schema-list/dist/index.js
  function wrapInList(listType, attrs = null) {
    return function(state, dispatch) {
      let { $from, $to } = state.selection;
      let range = $from.blockRange($to), doJoin = false, outerRange = range;
      if (!range)
        return false;
      if (range.depth >= 2 && $from.node(range.depth - 1).type.compatibleContent(listType) && range.startIndex == 0) {
        if ($from.index(range.depth - 1) == 0)
          return false;
        let $insert = state.doc.resolve(range.start - 2);
        outerRange = new NodeRange($insert, $insert, range.depth);
        if (range.endIndex < range.parent.childCount)
          range = new NodeRange($from, state.doc.resolve($to.end(range.depth)), range.depth);
        doJoin = true;
      }
      let wrap2 = findWrapping(outerRange, listType, attrs, range);
      if (!wrap2)
        return false;
      if (dispatch)
        dispatch(doWrapInList(state.tr, range, wrap2, doJoin, listType).scrollIntoView());
      return true;
    };
  }
  function doWrapInList(tr2, range, wrappers, joinBefore, listType) {
    let content = Fragment.empty;
    for (let i = wrappers.length - 1; i >= 0; i--)
      content = Fragment.from(wrappers[i].type.create(wrappers[i].attrs, content));
    tr2.step(new ReplaceAroundStep(range.start - (joinBefore ? 2 : 0), range.end, range.start, range.end, new Slice(content, 0, 0), wrappers.length, true));
    let found2 = 0;
    for (let i = 0; i < wrappers.length; i++)
      if (wrappers[i].type == listType)
        found2 = i + 1;
    let splitDepth = wrappers.length - found2;
    let splitPos = range.start + wrappers.length - (joinBefore ? 2 : 0), parent = range.parent;
    for (let i = range.startIndex, e = range.endIndex, first2 = true; i < e; i++, first2 = false) {
      if (!first2 && canSplit(tr2.doc, splitPos, splitDepth)) {
        tr2.split(splitPos, splitDepth);
        splitPos += 2 * splitDepth;
      }
      splitPos += parent.child(i).nodeSize;
    }
    return tr2;
  }
  function liftListItem(itemType) {
    return function(state, dispatch) {
      let { $from, $to } = state.selection;
      let range = $from.blockRange($to, (node) => node.childCount > 0 && node.firstChild.type == itemType);
      if (!range)
        return false;
      if (!dispatch)
        return true;
      if ($from.node(range.depth - 1).type == itemType)
        return liftToOuterList(state, dispatch, itemType, range);
      else
        return liftOutOfList(state, dispatch, range);
    };
  }
  function liftToOuterList(state, dispatch, itemType, range) {
    let tr2 = state.tr, end = range.end, endOfList = range.$to.end(range.depth);
    if (end < endOfList) {
      tr2.step(new ReplaceAroundStep(end - 1, endOfList, end, endOfList, new Slice(Fragment.from(itemType.create(null, range.parent.copy())), 1, 0), 1, true));
      range = new NodeRange(tr2.doc.resolve(range.$from.pos), tr2.doc.resolve(endOfList), range.depth);
    }
    const target = liftTarget(range);
    if (target == null)
      return false;
    tr2.lift(range, target);
    let after = tr2.mapping.map(end, -1) - 1;
    if (canJoin(tr2.doc, after))
      tr2.join(after);
    dispatch(tr2.scrollIntoView());
    return true;
  }
  function liftOutOfList(state, dispatch, range) {
    let tr2 = state.tr, list = range.parent;
    for (let pos = range.end, i = range.endIndex - 1, e = range.startIndex; i > e; i--) {
      pos -= list.child(i).nodeSize;
      tr2.delete(pos - 1, pos + 1);
    }
    let $start = tr2.doc.resolve(range.start), item = $start.nodeAfter;
    if (tr2.mapping.map(range.end) != range.start + $start.nodeAfter.nodeSize)
      return false;
    let atStart = range.startIndex == 0, atEnd = range.endIndex == list.childCount;
    let parent = $start.node(-1), indexBefore = $start.index(-1);
    if (!parent.canReplace(indexBefore + (atStart ? 0 : 1), indexBefore + 1, item.content.append(atEnd ? Fragment.empty : Fragment.from(list))))
      return false;
    let start = $start.pos, end = start + item.nodeSize;
    tr2.step(new ReplaceAroundStep(start - (atStart ? 1 : 0), end + (atEnd ? 1 : 0), start + 1, end - 1, new Slice((atStart ? Fragment.empty : Fragment.from(list.copy(Fragment.empty))).append(atEnd ? Fragment.empty : Fragment.from(list.copy(Fragment.empty))), atStart ? 0 : 1, atEnd ? 0 : 1), atStart ? 0 : 1));
    dispatch(tr2.scrollIntoView());
    return true;
  }
  function sinkListItem(itemType) {
    return function(state, dispatch) {
      let { $from, $to } = state.selection;
      let range = $from.blockRange($to, (node) => node.childCount > 0 && node.firstChild.type == itemType);
      if (!range)
        return false;
      let startIndex = range.startIndex;
      if (startIndex == 0)
        return false;
      let parent = range.parent, nodeBefore = parent.child(startIndex - 1);
      if (nodeBefore.type != itemType)
        return false;
      if (dispatch) {
        let nestedBefore = nodeBefore.lastChild && nodeBefore.lastChild.type == parent.type;
        let inner = Fragment.from(nestedBefore ? itemType.create() : null);
        let slice = new Slice(Fragment.from(itemType.create(null, Fragment.from(parent.type.create(null, inner)))), nestedBefore ? 3 : 1, 0);
        let before = range.start, after = range.end;
        dispatch(state.tr.step(new ReplaceAroundStep(before - (nestedBefore ? 3 : 1), after, before, after, slice, 1, true)).scrollIntoView());
      }
      return true;
    };
  }

  // node_modules/@tiptap/core/dist/index.js
  function createChainableState(config) {
    const { state, transaction } = config;
    let { selection } = transaction;
    let { doc } = transaction;
    let { storedMarks } = transaction;
    return {
      ...state,
      apply: state.apply.bind(state),
      applyTransaction: state.applyTransaction.bind(state),
      filterTransaction: state.filterTransaction,
      plugins: state.plugins,
      schema: state.schema,
      reconfigure: state.reconfigure.bind(state),
      toJSON: state.toJSON.bind(state),
      get storedMarks() {
        return storedMarks;
      },
      get selection() {
        return selection;
      },
      get doc() {
        return doc;
      },
      get tr() {
        selection = transaction.selection;
        doc = transaction.doc;
        storedMarks = transaction.storedMarks;
        return transaction;
      }
    };
  }
  var CommandManager = class {
    constructor(props) {
      this.editor = props.editor;
      this.rawCommands = this.editor.extensionManager.commands;
      this.customState = props.state;
    }
    get hasCustomState() {
      return !!this.customState;
    }
    get state() {
      return this.customState || this.editor.state;
    }
    get commands() {
      const { rawCommands, editor, state } = this;
      const { view } = editor;
      const { tr: tr2 } = state;
      const props = this.buildProps(tr2);
      return Object.fromEntries(Object.entries(rawCommands).map(([name, command2]) => {
        const method = (...args) => {
          const callback = command2(...args)(props);
          if (!tr2.getMeta("preventDispatch") && !this.hasCustomState) {
            view.dispatch(tr2);
          }
          return callback;
        };
        return [name, method];
      }));
    }
    get chain() {
      return () => this.createChain();
    }
    get can() {
      return () => this.createCan();
    }
    createChain(startTr, shouldDispatch = true) {
      const { rawCommands, editor, state } = this;
      const { view } = editor;
      const callbacks = [];
      const hasStartTransaction = !!startTr;
      const tr2 = startTr || state.tr;
      const run2 = () => {
        if (!hasStartTransaction && shouldDispatch && !tr2.getMeta("preventDispatch") && !this.hasCustomState) {
          view.dispatch(tr2);
        }
        return callbacks.every((callback) => callback === true);
      };
      const chain = {
        ...Object.fromEntries(Object.entries(rawCommands).map(([name, command2]) => {
          const chainedCommand = (...args) => {
            const props = this.buildProps(tr2, shouldDispatch);
            const callback = command2(...args)(props);
            callbacks.push(callback);
            return chain;
          };
          return [name, chainedCommand];
        })),
        run: run2
      };
      return chain;
    }
    createCan(startTr) {
      const { rawCommands, state } = this;
      const dispatch = false;
      const tr2 = startTr || state.tr;
      const props = this.buildProps(tr2, dispatch);
      const formattedCommands = Object.fromEntries(Object.entries(rawCommands).map(([name, command2]) => {
        return [name, (...args) => command2(...args)({ ...props, dispatch: void 0 })];
      }));
      return {
        ...formattedCommands,
        chain: () => this.createChain(tr2, dispatch)
      };
    }
    buildProps(tr2, shouldDispatch = true) {
      const { rawCommands, editor, state } = this;
      const { view } = editor;
      const props = {
        tr: tr2,
        editor,
        view,
        state: createChainableState({
          state,
          transaction: tr2
        }),
        dispatch: shouldDispatch ? () => void 0 : void 0,
        chain: () => this.createChain(tr2, shouldDispatch),
        can: () => this.createCan(tr2),
        get commands() {
          return Object.fromEntries(Object.entries(rawCommands).map(([name, command2]) => {
            return [name, (...args) => command2(...args)(props)];
          }));
        }
      };
      return props;
    }
  };
  function getExtensionField(extension, field, context) {
    if (extension.config[field] === void 0 && extension.parent) {
      return getExtensionField(extension.parent, field, context);
    }
    if (typeof extension.config[field] === "function") {
      const value = extension.config[field].bind({
        ...context,
        parent: extension.parent ? getExtensionField(extension.parent, field, context) : null
      });
      return value;
    }
    return extension.config[field];
  }
  function splitExtensions(extensions) {
    const baseExtensions = extensions.filter((extension) => extension.type === "extension");
    const nodeExtensions = extensions.filter((extension) => extension.type === "node");
    const markExtensions = extensions.filter((extension) => extension.type === "mark");
    return {
      baseExtensions,
      nodeExtensions,
      markExtensions
    };
  }
  function getNodeType(nameOrType, schema) {
    if (typeof nameOrType === "string") {
      if (!schema.nodes[nameOrType]) {
        throw Error(`There is no node type named '${nameOrType}'. Maybe you forgot to add the extension?`);
      }
      return schema.nodes[nameOrType];
    }
    return nameOrType;
  }
  function mergeAttributes(...objects) {
    return objects.filter((item) => !!item).reduce((items, item) => {
      const mergedAttributes = { ...items };
      Object.entries(item).forEach(([key, value]) => {
        const exists = mergedAttributes[key];
        if (!exists) {
          mergedAttributes[key] = value;
          return;
        }
        if (key === "class") {
          const valueClasses = value ? value.split(" ") : [];
          const existingClasses = mergedAttributes[key] ? mergedAttributes[key].split(" ") : [];
          const insertClasses = valueClasses.filter((valueClass) => !existingClasses.includes(valueClass));
          mergedAttributes[key] = [...existingClasses, ...insertClasses].join(" ");
        } else if (key === "style") {
          mergedAttributes[key] = [mergedAttributes[key], value].join("; ");
        } else {
          mergedAttributes[key] = value;
        }
      });
      return mergedAttributes;
    }, {});
  }
  function isFunction(value) {
    return typeof value === "function";
  }
  function callOrReturn(value, context = void 0, ...props) {
    if (isFunction(value)) {
      if (context) {
        return value.bind(context)(...props);
      }
      return value(...props);
    }
    return value;
  }
  function isRegExp(value) {
    return Object.prototype.toString.call(value) === "[object RegExp]";
  }
  function getType(value) {
    return Object.prototype.toString.call(value).slice(8, -1);
  }
  function isPlainObject(value) {
    if (getType(value) !== "Object") {
      return false;
    }
    return value.constructor === Object && Object.getPrototypeOf(value) === Object.prototype;
  }
  function mergeDeep(target, source) {
    const output = { ...target };
    if (isPlainObject(target) && isPlainObject(source)) {
      Object.keys(source).forEach((key) => {
        if (isPlainObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = mergeDeep(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }
  var Extension = class _Extension {
    constructor(config = {}) {
      this.type = "extension";
      this.name = "extension";
      this.parent = null;
      this.child = null;
      this.config = {
        name: this.name,
        defaultOptions: {}
      };
      this.config = {
        ...this.config,
        ...config
      };
      this.name = this.config.name;
      if (config.defaultOptions) {
        console.warn(`[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${this.name}".`);
      }
      this.options = this.config.defaultOptions;
      if (this.config.addOptions) {
        this.options = callOrReturn(getExtensionField(this, "addOptions", {
          name: this.name
        }));
      }
      this.storage = callOrReturn(getExtensionField(this, "addStorage", {
        name: this.name,
        options: this.options
      })) || {};
    }
    static create(config = {}) {
      return new _Extension(config);
    }
    configure(options = {}) {
      const extension = this.extend();
      extension.options = mergeDeep(this.options, options);
      extension.storage = callOrReturn(getExtensionField(extension, "addStorage", {
        name: extension.name,
        options: extension.options
      }));
      return extension;
    }
    extend(extendedConfig = {}) {
      const extension = new _Extension(extendedConfig);
      extension.parent = this;
      this.child = extension;
      extension.name = extendedConfig.name ? extendedConfig.name : extension.parent.name;
      if (extendedConfig.defaultOptions) {
        console.warn(`[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${extension.name}".`);
      }
      extension.options = callOrReturn(getExtensionField(extension, "addOptions", {
        name: extension.name
      }));
      extension.storage = callOrReturn(getExtensionField(extension, "addStorage", {
        name: extension.name,
        options: extension.options
      }));
      return extension;
    }
  };
  function getTextBetween(startNode, range, options) {
    const { from, to } = range;
    const { blockSeparator = "\n\n", textSerializers = {} } = options || {};
    let text = "";
    let separated = true;
    startNode.nodesBetween(from, to, (node, pos, parent, index) => {
      var _a;
      const textSerializer = textSerializers === null || textSerializers === void 0 ? void 0 : textSerializers[node.type.name];
      if (textSerializer) {
        if (node.isBlock && !separated) {
          text += blockSeparator;
          separated = true;
        }
        if (parent) {
          text += textSerializer({
            node,
            pos,
            parent,
            index,
            range
          });
        }
      } else if (node.isText) {
        text += (_a = node === null || node === void 0 ? void 0 : node.text) === null || _a === void 0 ? void 0 : _a.slice(Math.max(from, pos) - pos, to - pos);
        separated = false;
      } else if (node.isBlock && !separated) {
        text += blockSeparator;
        separated = true;
      }
    });
    return text;
  }
  function getTextSerializersFromSchema(schema) {
    return Object.fromEntries(Object.entries(schema.nodes).filter(([, node]) => node.spec.toText).map(([name, node]) => [name, node.spec.toText]));
  }
  var ClipboardTextSerializer = Extension.create({
    name: "clipboardTextSerializer",
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey("clipboardTextSerializer"),
          props: {
            clipboardTextSerializer: () => {
              const { editor } = this;
              const { state, schema } = editor;
              const { doc, selection } = state;
              const { ranges } = selection;
              const from = Math.min(...ranges.map((range2) => range2.$from.pos));
              const to = Math.max(...ranges.map((range2) => range2.$to.pos));
              const textSerializers = getTextSerializersFromSchema(schema);
              const range = { from, to };
              return getTextBetween(doc, range, {
                textSerializers
              });
            }
          }
        })
      ];
    }
  });
  var blur = () => ({ editor, view }) => {
    requestAnimationFrame(() => {
      var _a;
      if (!editor.isDestroyed) {
        view.dom.blur();
        (_a = window === null || window === void 0 ? void 0 : window.getSelection()) === null || _a === void 0 ? void 0 : _a.removeAllRanges();
      }
    });
    return true;
  };
  var clearContent = (emitUpdate = false) => ({ commands: commands2 }) => {
    return commands2.setContent("", emitUpdate);
  };
  var clearNodes = () => ({ state, tr: tr2, dispatch }) => {
    const { selection } = tr2;
    const { ranges } = selection;
    if (!dispatch) {
      return true;
    }
    ranges.forEach(({ $from, $to }) => {
      state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
        if (node.type.isText) {
          return;
        }
        const { doc, mapping } = tr2;
        const $mappedFrom = doc.resolve(mapping.map(pos));
        const $mappedTo = doc.resolve(mapping.map(pos + node.nodeSize));
        const nodeRange = $mappedFrom.blockRange($mappedTo);
        if (!nodeRange) {
          return;
        }
        const targetLiftDepth = liftTarget(nodeRange);
        if (node.type.isTextblock) {
          const { defaultType } = $mappedFrom.parent.contentMatchAt($mappedFrom.index());
          tr2.setNodeMarkup(nodeRange.start, defaultType);
        }
        if (targetLiftDepth || targetLiftDepth === 0) {
          tr2.lift(nodeRange, targetLiftDepth);
        }
      });
    });
    return true;
  };
  var command = (fn) => (props) => {
    return fn(props);
  };
  var createParagraphNear2 = () => ({ state, dispatch }) => {
    return createParagraphNear(state, dispatch);
  };
  var cut = (originRange, targetPos) => ({ editor, tr: tr2 }) => {
    const { state } = editor;
    const contentSlice = state.doc.slice(originRange.from, originRange.to);
    tr2.deleteRange(originRange.from, originRange.to);
    const newPos = tr2.mapping.map(targetPos);
    tr2.insert(newPos, contentSlice.content);
    tr2.setSelection(new TextSelection(tr2.doc.resolve(newPos - 1)));
    return true;
  };
  var deleteCurrentNode = () => ({ tr: tr2, dispatch }) => {
    const { selection } = tr2;
    const currentNode = selection.$anchor.node();
    if (currentNode.content.size > 0) {
      return false;
    }
    const $pos = tr2.selection.$anchor;
    for (let depth = $pos.depth; depth > 0; depth -= 1) {
      const node = $pos.node(depth);
      if (node.type === currentNode.type) {
        if (dispatch) {
          const from = $pos.before(depth);
          const to = $pos.after(depth);
          tr2.delete(from, to).scrollIntoView();
        }
        return true;
      }
    }
    return false;
  };
  var deleteNode = (typeOrName) => ({ tr: tr2, state, dispatch }) => {
    const type = getNodeType(typeOrName, state.schema);
    const $pos = tr2.selection.$anchor;
    for (let depth = $pos.depth; depth > 0; depth -= 1) {
      const node = $pos.node(depth);
      if (node.type === type) {
        if (dispatch) {
          const from = $pos.before(depth);
          const to = $pos.after(depth);
          tr2.delete(from, to).scrollIntoView();
        }
        return true;
      }
    }
    return false;
  };
  var deleteRange2 = (range) => ({ tr: tr2, dispatch }) => {
    const { from, to } = range;
    if (dispatch) {
      tr2.delete(from, to);
    }
    return true;
  };
  var deleteSelection2 = () => ({ state, dispatch }) => {
    return deleteSelection(state, dispatch);
  };
  var enter = () => ({ commands: commands2 }) => {
    return commands2.keyboardShortcut("Enter");
  };
  var exitCode2 = () => ({ state, dispatch }) => {
    return exitCode(state, dispatch);
  };
  function objectIncludes(object1, object2, options = { strict: true }) {
    const keys2 = Object.keys(object2);
    if (!keys2.length) {
      return true;
    }
    return keys2.every((key) => {
      if (options.strict) {
        return object2[key] === object1[key];
      }
      if (isRegExp(object2[key])) {
        return object2[key].test(object1[key]);
      }
      return object2[key] === object1[key];
    });
  }
  function findMarkInSet(marks, type, attributes = {}) {
    return marks.find((item) => {
      return item.type === type && objectIncludes(item.attrs, attributes);
    });
  }
  function isMarkInSet(marks, type, attributes = {}) {
    return !!findMarkInSet(marks, type, attributes);
  }
  function getMarkRange($pos, type, attributes = {}) {
    if (!$pos || !type) {
      return;
    }
    let start = $pos.parent.childAfter($pos.parentOffset);
    if ($pos.parentOffset === start.offset && start.offset !== 0) {
      start = $pos.parent.childBefore($pos.parentOffset);
    }
    if (!start.node) {
      return;
    }
    const mark = findMarkInSet([...start.node.marks], type, attributes);
    if (!mark) {
      return;
    }
    let startIndex = start.index;
    let startPos = $pos.start() + start.offset;
    let endIndex = startIndex + 1;
    let endPos = startPos + start.node.nodeSize;
    findMarkInSet([...start.node.marks], type, attributes);
    while (startIndex > 0 && mark.isInSet($pos.parent.child(startIndex - 1).marks)) {
      startIndex -= 1;
      startPos -= $pos.parent.child(startIndex).nodeSize;
    }
    while (endIndex < $pos.parent.childCount && isMarkInSet([...$pos.parent.child(endIndex).marks], type, attributes)) {
      endPos += $pos.parent.child(endIndex).nodeSize;
      endIndex += 1;
    }
    return {
      from: startPos,
      to: endPos
    };
  }
  function getMarkType(nameOrType, schema) {
    if (typeof nameOrType === "string") {
      if (!schema.marks[nameOrType]) {
        throw Error(`There is no mark type named '${nameOrType}'. Maybe you forgot to add the extension?`);
      }
      return schema.marks[nameOrType];
    }
    return nameOrType;
  }
  var extendMarkRange = (typeOrName, attributes = {}) => ({ tr: tr2, state, dispatch }) => {
    const type = getMarkType(typeOrName, state.schema);
    const { doc, selection } = tr2;
    const { $from, from, to } = selection;
    if (dispatch) {
      const range = getMarkRange($from, type, attributes);
      if (range && range.from <= from && range.to >= to) {
        const newSelection = TextSelection.create(doc, range.from, range.to);
        tr2.setSelection(newSelection);
      }
    }
    return true;
  };
  var first = (commands2) => (props) => {
    const items = typeof commands2 === "function" ? commands2(props) : commands2;
    for (let i = 0; i < items.length; i += 1) {
      if (items[i](props)) {
        return true;
      }
    }
    return false;
  };
  function isTextSelection(value) {
    return value instanceof TextSelection;
  }
  function minMax(value = 0, min = 0, max = 0) {
    return Math.min(Math.max(value, min), max);
  }
  function resolveFocusPosition(doc, position = null) {
    if (!position) {
      return null;
    }
    const selectionAtStart = Selection.atStart(doc);
    const selectionAtEnd = Selection.atEnd(doc);
    if (position === "start" || position === true) {
      return selectionAtStart;
    }
    if (position === "end") {
      return selectionAtEnd;
    }
    const minPos = selectionAtStart.from;
    const maxPos = selectionAtEnd.to;
    if (position === "all") {
      return TextSelection.create(doc, minMax(0, minPos, maxPos), minMax(doc.content.size, minPos, maxPos));
    }
    return TextSelection.create(doc, minMax(position, minPos, maxPos), minMax(position, minPos, maxPos));
  }
  function isiOS() {
    return [
      "iPad Simulator",
      "iPhone Simulator",
      "iPod Simulator",
      "iPad",
      "iPhone",
      "iPod"
    ].includes(navigator.platform) || navigator.userAgent.includes("Mac") && "ontouchend" in document;
  }
  var focus = (position = null, options = {}) => ({ editor, view, tr: tr2, dispatch }) => {
    options = {
      scrollIntoView: true,
      ...options
    };
    const delayedFocus = () => {
      if (isiOS()) {
        view.dom.focus();
      }
      requestAnimationFrame(() => {
        if (!editor.isDestroyed) {
          view.focus();
          if (options === null || options === void 0 ? void 0 : options.scrollIntoView) {
            editor.commands.scrollIntoView();
          }
        }
      });
    };
    if (view.hasFocus() && position === null || position === false) {
      return true;
    }
    if (dispatch && position === null && !isTextSelection(editor.state.selection)) {
      delayedFocus();
      return true;
    }
    const selection = resolveFocusPosition(tr2.doc, position) || editor.state.selection;
    const isSameSelection = editor.state.selection.eq(selection);
    if (dispatch) {
      if (!isSameSelection) {
        tr2.setSelection(selection);
      }
      if (isSameSelection && tr2.storedMarks) {
        tr2.setStoredMarks(tr2.storedMarks);
      }
      delayedFocus();
    }
    return true;
  };
  var forEach = (items, fn) => (props) => {
    return items.every((item, index) => fn(item, { ...props, index }));
  };
  var insertContent = (value, options) => ({ tr: tr2, commands: commands2 }) => {
    return commands2.insertContentAt({ from: tr2.selection.from, to: tr2.selection.to }, value, options);
  };
  function elementFromString(value) {
    const wrappedValue = `<body>${value}</body>`;
    return new window.DOMParser().parseFromString(wrappedValue, "text/html").body;
  }
  function createNodeFromContent(content, schema, options) {
    options = {
      slice: true,
      parseOptions: {},
      ...options
    };
    if (typeof content === "object" && content !== null) {
      try {
        if (Array.isArray(content) && content.length > 0) {
          return Fragment.fromArray(content.map((item) => schema.nodeFromJSON(item)));
        }
        return schema.nodeFromJSON(content);
      } catch (error) {
        console.warn("[tiptap warn]: Invalid content.", "Passed value:", content, "Error:", error);
        return createNodeFromContent("", schema, options);
      }
    }
    if (typeof content === "string") {
      const parser = DOMParser.fromSchema(schema);
      return options.slice ? parser.parseSlice(elementFromString(content), options.parseOptions).content : parser.parse(elementFromString(content), options.parseOptions);
    }
    return createNodeFromContent("", schema, options);
  }
  function selectionToInsertionEnd2(tr2, startLen, bias) {
    const last = tr2.steps.length - 1;
    if (last < startLen) {
      return;
    }
    const step = tr2.steps[last];
    if (!(step instanceof ReplaceStep || step instanceof ReplaceAroundStep)) {
      return;
    }
    const map = tr2.mapping.maps[last];
    let end = 0;
    map.forEach((_from, _to, _newFrom, newTo) => {
      if (end === 0) {
        end = newTo;
      }
    });
    tr2.setSelection(Selection.near(tr2.doc.resolve(end), bias));
  }
  var isFragment = (nodeOrFragment) => {
    return nodeOrFragment.toString().startsWith("<");
  };
  var insertContentAt = (position, value, options) => ({ tr: tr2, dispatch, editor }) => {
    if (dispatch) {
      options = {
        parseOptions: {},
        updateSelection: true,
        ...options
      };
      const content = createNodeFromContent(value, editor.schema, {
        parseOptions: {
          preserveWhitespace: "full",
          ...options.parseOptions
        }
      });
      if (content.toString() === "<>") {
        return true;
      }
      let { from, to } = typeof position === "number" ? { from: position, to: position } : { from: position.from, to: position.to };
      let isOnlyTextContent = true;
      let isOnlyBlockContent = true;
      const nodes = isFragment(content) ? content : [content];
      nodes.forEach((node) => {
        node.check();
        isOnlyTextContent = isOnlyTextContent ? node.isText && node.marks.length === 0 : false;
        isOnlyBlockContent = isOnlyBlockContent ? node.isBlock : false;
      });
      if (from === to && isOnlyBlockContent) {
        const { parent } = tr2.doc.resolve(from);
        const isEmptyTextBlock = parent.isTextblock && !parent.type.spec.code && !parent.childCount;
        if (isEmptyTextBlock) {
          from -= 1;
          to += 1;
        }
      }
      if (isOnlyTextContent) {
        if (Array.isArray(value)) {
          tr2.insertText(value.map((v) => v.text || "").join(""), from, to);
        } else if (typeof value === "object" && !!value && !!value.text) {
          tr2.insertText(value.text, from, to);
        } else {
          tr2.insertText(value, from, to);
        }
      } else {
        tr2.replaceWith(from, to, content);
      }
      if (options.updateSelection) {
        selectionToInsertionEnd2(tr2, tr2.steps.length - 1, -1);
      }
    }
    return true;
  };
  var joinUp2 = () => ({ state, dispatch }) => {
    return joinUp(state, dispatch);
  };
  var joinDown2 = () => ({ state, dispatch }) => {
    return joinDown(state, dispatch);
  };
  var joinBackward2 = () => ({ state, dispatch }) => {
    return joinBackward(state, dispatch);
  };
  var joinForward2 = () => ({ state, dispatch }) => {
    return joinForward(state, dispatch);
  };
  var joinItemBackward = () => ({ tr: tr2, state, dispatch }) => {
    try {
      const point = joinPoint(state.doc, state.selection.$from.pos, -1);
      if (point === null || point === void 0) {
        return false;
      }
      tr2.join(point, 2);
      if (dispatch) {
        dispatch(tr2);
      }
      return true;
    } catch {
      return false;
    }
  };
  var joinItemForward = () => ({ state, dispatch, tr: tr2 }) => {
    try {
      const point = joinPoint(state.doc, state.selection.$from.pos, 1);
      if (point === null || point === void 0) {
        return false;
      }
      tr2.join(point, 2);
      if (dispatch) {
        dispatch(tr2);
      }
      return true;
    } catch (e) {
      return false;
    }
  };
  function isMacOS() {
    return typeof navigator !== "undefined" ? /Mac/.test(navigator.platform) : false;
  }
  function normalizeKeyName(name) {
    const parts = name.split(/-(?!$)/);
    let result = parts[parts.length - 1];
    if (result === "Space") {
      result = " ";
    }
    let alt;
    let ctrl;
    let shift;
    let meta;
    for (let i = 0; i < parts.length - 1; i += 1) {
      const mod = parts[i];
      if (/^(cmd|meta|m)$/i.test(mod)) {
        meta = true;
      } else if (/^a(lt)?$/i.test(mod)) {
        alt = true;
      } else if (/^(c|ctrl|control)$/i.test(mod)) {
        ctrl = true;
      } else if (/^s(hift)?$/i.test(mod)) {
        shift = true;
      } else if (/^mod$/i.test(mod)) {
        if (isiOS() || isMacOS()) {
          meta = true;
        } else {
          ctrl = true;
        }
      } else {
        throw new Error(`Unrecognized modifier name: ${mod}`);
      }
    }
    if (alt) {
      result = `Alt-${result}`;
    }
    if (ctrl) {
      result = `Ctrl-${result}`;
    }
    if (meta) {
      result = `Meta-${result}`;
    }
    if (shift) {
      result = `Shift-${result}`;
    }
    return result;
  }
  var keyboardShortcut = (name) => ({ editor, view, tr: tr2, dispatch }) => {
    const keys2 = normalizeKeyName(name).split(/-(?!$)/);
    const key = keys2.find((item) => !["Alt", "Ctrl", "Meta", "Shift"].includes(item));
    const event = new KeyboardEvent("keydown", {
      key: key === "Space" ? " " : key,
      altKey: keys2.includes("Alt"),
      ctrlKey: keys2.includes("Ctrl"),
      metaKey: keys2.includes("Meta"),
      shiftKey: keys2.includes("Shift"),
      bubbles: true,
      cancelable: true
    });
    const capturedTransaction = editor.captureTransaction(() => {
      view.someProp("handleKeyDown", (f) => f(view, event));
    });
    capturedTransaction === null || capturedTransaction === void 0 ? void 0 : capturedTransaction.steps.forEach((step) => {
      const newStep = step.map(tr2.mapping);
      if (newStep && dispatch) {
        tr2.maybeStep(newStep);
      }
    });
    return true;
  };
  function isNodeActive(state, typeOrName, attributes = {}) {
    const { from, to, empty } = state.selection;
    const type = typeOrName ? getNodeType(typeOrName, state.schema) : null;
    const nodeRanges = [];
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (node.isText) {
        return;
      }
      const relativeFrom = Math.max(from, pos);
      const relativeTo = Math.min(to, pos + node.nodeSize);
      nodeRanges.push({
        node,
        from: relativeFrom,
        to: relativeTo
      });
    });
    const selectionRange = to - from;
    const matchedNodeRanges = nodeRanges.filter((nodeRange) => {
      if (!type) {
        return true;
      }
      return type.name === nodeRange.node.type.name;
    }).filter((nodeRange) => objectIncludes(nodeRange.node.attrs, attributes, { strict: false }));
    if (empty) {
      return !!matchedNodeRanges.length;
    }
    const range = matchedNodeRanges.reduce((sum, nodeRange) => sum + nodeRange.to - nodeRange.from, 0);
    return range >= selectionRange;
  }
  var lift3 = (typeOrName, attributes = {}) => ({ state, dispatch }) => {
    const type = getNodeType(typeOrName, state.schema);
    const isActive = isNodeActive(state, type, attributes);
    if (!isActive) {
      return false;
    }
    return lift2(state, dispatch);
  };
  var liftEmptyBlock2 = () => ({ state, dispatch }) => {
    return liftEmptyBlock(state, dispatch);
  };
  var liftListItem2 = (typeOrName) => ({ state, dispatch }) => {
    const type = getNodeType(typeOrName, state.schema);
    return liftListItem(type)(state, dispatch);
  };
  var newlineInCode2 = () => ({ state, dispatch }) => {
    return newlineInCode(state, dispatch);
  };
  function getSchemaTypeNameByName(name, schema) {
    if (schema.nodes[name]) {
      return "node";
    }
    if (schema.marks[name]) {
      return "mark";
    }
    return null;
  }
  function deleteProps(obj, propOrProps) {
    const props = typeof propOrProps === "string" ? [propOrProps] : propOrProps;
    return Object.keys(obj).reduce((newObj, prop) => {
      if (!props.includes(prop)) {
        newObj[prop] = obj[prop];
      }
      return newObj;
    }, {});
  }
  var resetAttributes = (typeOrName, attributes) => ({ tr: tr2, state, dispatch }) => {
    let nodeType = null;
    let markType = null;
    const schemaType = getSchemaTypeNameByName(typeof typeOrName === "string" ? typeOrName : typeOrName.name, state.schema);
    if (!schemaType) {
      return false;
    }
    if (schemaType === "node") {
      nodeType = getNodeType(typeOrName, state.schema);
    }
    if (schemaType === "mark") {
      markType = getMarkType(typeOrName, state.schema);
    }
    if (dispatch) {
      tr2.selection.ranges.forEach((range) => {
        state.doc.nodesBetween(range.$from.pos, range.$to.pos, (node, pos) => {
          if (nodeType && nodeType === node.type) {
            tr2.setNodeMarkup(pos, void 0, deleteProps(node.attrs, attributes));
          }
          if (markType && node.marks.length) {
            node.marks.forEach((mark) => {
              if (markType === mark.type) {
                tr2.addMark(pos, pos + node.nodeSize, markType.create(deleteProps(mark.attrs, attributes)));
              }
            });
          }
        });
      });
    }
    return true;
  };
  var scrollIntoView = () => ({ tr: tr2, dispatch }) => {
    if (dispatch) {
      tr2.scrollIntoView();
    }
    return true;
  };
  var selectAll2 = () => ({ tr: tr2, commands: commands2 }) => {
    return commands2.setTextSelection({
      from: 0,
      to: tr2.doc.content.size
    });
  };
  var selectNodeBackward2 = () => ({ state, dispatch }) => {
    return selectNodeBackward(state, dispatch);
  };
  var selectNodeForward2 = () => ({ state, dispatch }) => {
    return selectNodeForward(state, dispatch);
  };
  var selectParentNode2 = () => ({ state, dispatch }) => {
    return selectParentNode(state, dispatch);
  };
  var selectTextblockEnd2 = () => ({ state, dispatch }) => {
    return selectTextblockEnd(state, dispatch);
  };
  var selectTextblockStart2 = () => ({ state, dispatch }) => {
    return selectTextblockStart(state, dispatch);
  };
  function createDocument(content, schema, parseOptions = {}) {
    return createNodeFromContent(content, schema, { slice: false, parseOptions });
  }
  var setContent = (content, emitUpdate = false, parseOptions = {}) => ({ tr: tr2, editor, dispatch }) => {
    const { doc } = tr2;
    const document2 = createDocument(content, editor.schema, parseOptions);
    if (dispatch) {
      tr2.replaceWith(0, doc.content.size, document2).setMeta("preventUpdate", !emitUpdate);
    }
    return true;
  };
  function getMarkAttributes(state, typeOrName) {
    const type = getMarkType(typeOrName, state.schema);
    const { from, to, empty } = state.selection;
    const marks = [];
    if (empty) {
      if (state.storedMarks) {
        marks.push(...state.storedMarks);
      }
      marks.push(...state.selection.$head.marks());
    } else {
      state.doc.nodesBetween(from, to, (node) => {
        marks.push(...node.marks);
      });
    }
    const mark = marks.find((markItem) => markItem.type.name === type.name);
    if (!mark) {
      return {};
    }
    return { ...mark.attrs };
  }
  function combineTransactionSteps(oldDoc, transactions) {
    const transform = new Transform(oldDoc);
    transactions.forEach((transaction) => {
      transaction.steps.forEach((step) => {
        transform.step(step);
      });
    });
    return transform;
  }
  function defaultBlockAt2(match) {
    for (let i = 0; i < match.edgeCount; i += 1) {
      const { type } = match.edge(i);
      if (type.isTextblock && !type.hasRequiredAttrs()) {
        return type;
      }
    }
    return null;
  }
  function findChildrenInRange(node, range, predicate) {
    const nodesWithPos = [];
    node.nodesBetween(range.from, range.to, (child, pos) => {
      if (predicate(child)) {
        nodesWithPos.push({
          node: child,
          pos
        });
      }
    });
    return nodesWithPos;
  }
  function findParentNodeClosestToPos($pos, predicate) {
    for (let i = $pos.depth; i > 0; i -= 1) {
      const node = $pos.node(i);
      if (predicate(node)) {
        return {
          pos: i > 0 ? $pos.before(i) : 0,
          start: $pos.start(i),
          depth: i,
          node
        };
      }
    }
  }
  function findParentNode(predicate) {
    return (selection) => findParentNodeClosestToPos(selection.$from, predicate);
  }
  function getNodeAttributes(state, typeOrName) {
    const type = getNodeType(typeOrName, state.schema);
    const { from, to } = state.selection;
    const nodes = [];
    state.doc.nodesBetween(from, to, (node2) => {
      nodes.push(node2);
    });
    const node = nodes.reverse().find((nodeItem) => nodeItem.type.name === type.name);
    if (!node) {
      return {};
    }
    return { ...node.attrs };
  }
  function getAttributes(state, typeOrName) {
    const schemaType = getSchemaTypeNameByName(typeof typeOrName === "string" ? typeOrName : typeOrName.name, state.schema);
    if (schemaType === "node") {
      return getNodeAttributes(state, typeOrName);
    }
    if (schemaType === "mark") {
      return getMarkAttributes(state, typeOrName);
    }
    return {};
  }
  function removeDuplicates(array, by = JSON.stringify) {
    const seen = {};
    return array.filter((item) => {
      const key = by(item);
      return Object.prototype.hasOwnProperty.call(seen, key) ? false : seen[key] = true;
    });
  }
  function simplifyChangedRanges(changes) {
    const uniqueChanges = removeDuplicates(changes);
    return uniqueChanges.length === 1 ? uniqueChanges : uniqueChanges.filter((change, index) => {
      const rest = uniqueChanges.filter((_, i) => i !== index);
      return !rest.some((otherChange) => {
        return change.oldRange.from >= otherChange.oldRange.from && change.oldRange.to <= otherChange.oldRange.to && change.newRange.from >= otherChange.newRange.from && change.newRange.to <= otherChange.newRange.to;
      });
    });
  }
  function getChangedRanges(transform) {
    const { mapping, steps } = transform;
    const changes = [];
    mapping.maps.forEach((stepMap, index) => {
      const ranges = [];
      if (!stepMap.ranges.length) {
        const { from, to } = steps[index];
        if (from === void 0 || to === void 0) {
          return;
        }
        ranges.push({ from, to });
      } else {
        stepMap.forEach((from, to) => {
          ranges.push({ from, to });
        });
      }
      ranges.forEach(({ from, to }) => {
        const newStart = mapping.slice(index).map(from, -1);
        const newEnd = mapping.slice(index).map(to);
        const oldStart = mapping.invert().map(newStart, -1);
        const oldEnd = mapping.invert().map(newEnd);
        changes.push({
          oldRange: {
            from: oldStart,
            to: oldEnd
          },
          newRange: {
            from: newStart,
            to: newEnd
          }
        });
      });
    });
    return simplifyChangedRanges(changes);
  }
  function getMarksBetween(from, to, doc) {
    const marks = [];
    if (from === to) {
      doc.resolve(from).marks().forEach((mark) => {
        const $pos = doc.resolve(from - 1);
        const range = getMarkRange($pos, mark.type);
        if (!range) {
          return;
        }
        marks.push({
          mark,
          ...range
        });
      });
    } else {
      doc.nodesBetween(from, to, (node, pos) => {
        marks.push(...node.marks.map((mark) => ({
          from: pos,
          to: pos + node.nodeSize,
          mark
        })));
      });
    }
    return marks;
  }
  function getSplittedAttributes(extensionAttributes, typeName, attributes) {
    return Object.fromEntries(Object.entries(attributes).filter(([name]) => {
      const extensionAttribute = extensionAttributes.find((item) => {
        return item.type === typeName && item.name === name;
      });
      if (!extensionAttribute) {
        return false;
      }
      return extensionAttribute.attribute.keepOnSplit;
    }));
  }
  function isMarkActive(state, typeOrName, attributes = {}) {
    const { empty, ranges } = state.selection;
    const type = typeOrName ? getMarkType(typeOrName, state.schema) : null;
    if (empty) {
      return !!(state.storedMarks || state.selection.$from.marks()).filter((mark) => {
        if (!type) {
          return true;
        }
        return type.name === mark.type.name;
      }).find((mark) => objectIncludes(mark.attrs, attributes, { strict: false }));
    }
    let selectionRange = 0;
    const markRanges = [];
    ranges.forEach(({ $from, $to }) => {
      const from = $from.pos;
      const to = $to.pos;
      state.doc.nodesBetween(from, to, (node, pos) => {
        if (!node.isText && !node.marks.length) {
          return;
        }
        const relativeFrom = Math.max(from, pos);
        const relativeTo = Math.min(to, pos + node.nodeSize);
        const range2 = relativeTo - relativeFrom;
        selectionRange += range2;
        markRanges.push(...node.marks.map((mark) => ({
          mark,
          from: relativeFrom,
          to: relativeTo
        })));
      });
    });
    if (selectionRange === 0) {
      return false;
    }
    const matchedRange = markRanges.filter((markRange) => {
      if (!type) {
        return true;
      }
      return type.name === markRange.mark.type.name;
    }).filter((markRange) => objectIncludes(markRange.mark.attrs, attributes, { strict: false })).reduce((sum, markRange) => sum + markRange.to - markRange.from, 0);
    const excludedRange = markRanges.filter((markRange) => {
      if (!type) {
        return true;
      }
      return markRange.mark.type !== type && markRange.mark.type.excludes(type);
    }).reduce((sum, markRange) => sum + markRange.to - markRange.from, 0);
    const range = matchedRange > 0 ? matchedRange + excludedRange : matchedRange;
    return range >= selectionRange;
  }
  function isList(name, extensions) {
    const { nodeExtensions } = splitExtensions(extensions);
    const extension = nodeExtensions.find((item) => item.name === name);
    if (!extension) {
      return false;
    }
    const context = {
      name: extension.name,
      options: extension.options,
      storage: extension.storage
    };
    const group = callOrReturn(getExtensionField(extension, "group", context));
    if (typeof group !== "string") {
      return false;
    }
    return group.split(" ").includes("list");
  }
  function canSetMark(state, tr2, newMarkType) {
    var _a;
    const { selection } = tr2;
    let cursor = null;
    if (isTextSelection(selection)) {
      cursor = selection.$cursor;
    }
    if (cursor) {
      const currentMarks = (_a = state.storedMarks) !== null && _a !== void 0 ? _a : cursor.marks();
      return !!newMarkType.isInSet(currentMarks) || !currentMarks.some((mark) => mark.type.excludes(newMarkType));
    }
    const { ranges } = selection;
    return ranges.some(({ $from, $to }) => {
      let someNodeSupportsMark = $from.depth === 0 ? state.doc.inlineContent && state.doc.type.allowsMarkType(newMarkType) : false;
      state.doc.nodesBetween($from.pos, $to.pos, (node, _pos, parent) => {
        if (someNodeSupportsMark) {
          return false;
        }
        if (node.isInline) {
          const parentAllowsMarkType = !parent || parent.type.allowsMarkType(newMarkType);
          const currentMarksAllowMarkType = !!newMarkType.isInSet(node.marks) || !node.marks.some((otherMark) => otherMark.type.excludes(newMarkType));
          someNodeSupportsMark = parentAllowsMarkType && currentMarksAllowMarkType;
        }
        return !someNodeSupportsMark;
      });
      return someNodeSupportsMark;
    });
  }
  var setMark = (typeOrName, attributes = {}) => ({ tr: tr2, state, dispatch }) => {
    const { selection } = tr2;
    const { empty, ranges } = selection;
    const type = getMarkType(typeOrName, state.schema);
    if (dispatch) {
      if (empty) {
        const oldAttributes = getMarkAttributes(state, type);
        tr2.addStoredMark(type.create({
          ...oldAttributes,
          ...attributes
        }));
      } else {
        ranges.forEach((range) => {
          const from = range.$from.pos;
          const to = range.$to.pos;
          state.doc.nodesBetween(from, to, (node, pos) => {
            const trimmedFrom = Math.max(pos, from);
            const trimmedTo = Math.min(pos + node.nodeSize, to);
            const someHasMark = node.marks.find((mark) => mark.type === type);
            if (someHasMark) {
              node.marks.forEach((mark) => {
                if (type === mark.type) {
                  tr2.addMark(trimmedFrom, trimmedTo, type.create({
                    ...mark.attrs,
                    ...attributes
                  }));
                }
              });
            } else {
              tr2.addMark(trimmedFrom, trimmedTo, type.create(attributes));
            }
          });
        });
      }
    }
    return canSetMark(state, tr2, type);
  };
  var setMeta = (key, value) => ({ tr: tr2 }) => {
    tr2.setMeta(key, value);
    return true;
  };
  var setNode = (typeOrName, attributes = {}) => ({ state, dispatch, chain }) => {
    const type = getNodeType(typeOrName, state.schema);
    if (!type.isTextblock) {
      console.warn('[tiptap warn]: Currently "setNode()" only supports text block nodes.');
      return false;
    }
    return chain().command(({ commands: commands2 }) => {
      const canSetBlock = setBlockType2(type, attributes)(state);
      if (canSetBlock) {
        return true;
      }
      return commands2.clearNodes();
    }).command(({ state: updatedState }) => {
      return setBlockType2(type, attributes)(updatedState, dispatch);
    }).run();
  };
  var setNodeSelection = (position) => ({ tr: tr2, dispatch }) => {
    if (dispatch) {
      const { doc } = tr2;
      const from = minMax(position, 0, doc.content.size);
      const selection = NodeSelection.create(doc, from);
      tr2.setSelection(selection);
    }
    return true;
  };
  var setTextSelection = (position) => ({ tr: tr2, dispatch }) => {
    if (dispatch) {
      const { doc } = tr2;
      const { from, to } = typeof position === "number" ? { from: position, to: position } : position;
      const minPos = TextSelection.atStart(doc).from;
      const maxPos = TextSelection.atEnd(doc).to;
      const resolvedFrom = minMax(from, minPos, maxPos);
      const resolvedEnd = minMax(to, minPos, maxPos);
      const selection = TextSelection.create(doc, resolvedFrom, resolvedEnd);
      tr2.setSelection(selection);
    }
    return true;
  };
  var sinkListItem2 = (typeOrName) => ({ state, dispatch }) => {
    const type = getNodeType(typeOrName, state.schema);
    return sinkListItem(type)(state, dispatch);
  };
  function ensureMarks(state, splittableMarks) {
    const marks = state.storedMarks || state.selection.$to.parentOffset && state.selection.$from.marks();
    if (marks) {
      const filteredMarks = marks.filter((mark) => splittableMarks === null || splittableMarks === void 0 ? void 0 : splittableMarks.includes(mark.type.name));
      state.tr.ensureMarks(filteredMarks);
    }
  }
  var splitBlock2 = ({ keepMarks = true } = {}) => ({ tr: tr2, state, dispatch, editor }) => {
    const { selection, doc } = tr2;
    const { $from, $to } = selection;
    const extensionAttributes = editor.extensionManager.attributes;
    const newAttributes = getSplittedAttributes(extensionAttributes, $from.node().type.name, $from.node().attrs);
    if (selection instanceof NodeSelection && selection.node.isBlock) {
      if (!$from.parentOffset || !canSplit(doc, $from.pos)) {
        return false;
      }
      if (dispatch) {
        if (keepMarks) {
          ensureMarks(state, editor.extensionManager.splittableMarks);
        }
        tr2.split($from.pos).scrollIntoView();
      }
      return true;
    }
    if (!$from.parent.isBlock) {
      return false;
    }
    if (dispatch) {
      const atEnd = $to.parentOffset === $to.parent.content.size;
      if (selection instanceof TextSelection) {
        tr2.deleteSelection();
      }
      const deflt = $from.depth === 0 ? void 0 : defaultBlockAt2($from.node(-1).contentMatchAt($from.indexAfter(-1)));
      let types = atEnd && deflt ? [
        {
          type: deflt,
          attrs: newAttributes
        }
      ] : void 0;
      let can = canSplit(tr2.doc, tr2.mapping.map($from.pos), 1, types);
      if (!types && !can && canSplit(tr2.doc, tr2.mapping.map($from.pos), 1, deflt ? [{ type: deflt }] : void 0)) {
        can = true;
        types = deflt ? [
          {
            type: deflt,
            attrs: newAttributes
          }
        ] : void 0;
      }
      if (can) {
        tr2.split(tr2.mapping.map($from.pos), 1, types);
        if (deflt && !atEnd && !$from.parentOffset && $from.parent.type !== deflt) {
          const first2 = tr2.mapping.map($from.before());
          const $first = tr2.doc.resolve(first2);
          if ($from.node(-1).canReplaceWith($first.index(), $first.index() + 1, deflt)) {
            tr2.setNodeMarkup(tr2.mapping.map($from.before()), deflt);
          }
        }
      }
      if (keepMarks) {
        ensureMarks(state, editor.extensionManager.splittableMarks);
      }
      tr2.scrollIntoView();
    }
    return true;
  };
  var splitListItem = (typeOrName) => ({ tr: tr2, state, dispatch, editor }) => {
    var _a;
    const type = getNodeType(typeOrName, state.schema);
    const { $from, $to } = state.selection;
    const node = state.selection.node;
    if (node && node.isBlock || $from.depth < 2 || !$from.sameParent($to)) {
      return false;
    }
    const grandParent = $from.node(-1);
    if (grandParent.type !== type) {
      return false;
    }
    const extensionAttributes = editor.extensionManager.attributes;
    if ($from.parent.content.size === 0 && $from.node(-1).childCount === $from.indexAfter(-1)) {
      if ($from.depth === 2 || $from.node(-3).type !== type || $from.index(-2) !== $from.node(-2).childCount - 1) {
        return false;
      }
      if (dispatch) {
        let wrap2 = Fragment.empty;
        const depthBefore = $from.index(-1) ? 1 : $from.index(-2) ? 2 : 3;
        for (let d = $from.depth - depthBefore; d >= $from.depth - 3; d -= 1) {
          wrap2 = Fragment.from($from.node(d).copy(wrap2));
        }
        const depthAfter = $from.indexAfter(-1) < $from.node(-2).childCount ? 1 : $from.indexAfter(-2) < $from.node(-3).childCount ? 2 : 3;
        const newNextTypeAttributes2 = getSplittedAttributes(extensionAttributes, $from.node().type.name, $from.node().attrs);
        const nextType2 = ((_a = type.contentMatch.defaultType) === null || _a === void 0 ? void 0 : _a.createAndFill(newNextTypeAttributes2)) || void 0;
        wrap2 = wrap2.append(Fragment.from(type.createAndFill(null, nextType2) || void 0));
        const start = $from.before($from.depth - (depthBefore - 1));
        tr2.replace(start, $from.after(-depthAfter), new Slice(wrap2, 4 - depthBefore, 0));
        let sel = -1;
        tr2.doc.nodesBetween(start, tr2.doc.content.size, (n, pos) => {
          if (sel > -1) {
            return false;
          }
          if (n.isTextblock && n.content.size === 0) {
            sel = pos + 1;
          }
        });
        if (sel > -1) {
          tr2.setSelection(TextSelection.near(tr2.doc.resolve(sel)));
        }
        tr2.scrollIntoView();
      }
      return true;
    }
    const nextType = $to.pos === $from.end() ? grandParent.contentMatchAt(0).defaultType : null;
    const newTypeAttributes = getSplittedAttributes(extensionAttributes, grandParent.type.name, grandParent.attrs);
    const newNextTypeAttributes = getSplittedAttributes(extensionAttributes, $from.node().type.name, $from.node().attrs);
    tr2.delete($from.pos, $to.pos);
    const types = nextType ? [
      { type, attrs: newTypeAttributes },
      { type: nextType, attrs: newNextTypeAttributes }
    ] : [{ type, attrs: newTypeAttributes }];
    if (!canSplit(tr2.doc, $from.pos, 2)) {
      return false;
    }
    if (dispatch) {
      const { selection, storedMarks } = state;
      const { splittableMarks } = editor.extensionManager;
      const marks = storedMarks || selection.$to.parentOffset && selection.$from.marks();
      tr2.split($from.pos, 2, types).scrollIntoView();
      if (!marks || !dispatch) {
        return true;
      }
      const filteredMarks = marks.filter((mark) => splittableMarks.includes(mark.type.name));
      tr2.ensureMarks(filteredMarks);
    }
    return true;
  };
  var joinListBackwards = (tr2, listType) => {
    const list = findParentNode((node) => node.type === listType)(tr2.selection);
    if (!list) {
      return true;
    }
    const before = tr2.doc.resolve(Math.max(0, list.pos - 1)).before(list.depth);
    if (before === void 0) {
      return true;
    }
    const nodeBefore = tr2.doc.nodeAt(before);
    const canJoinBackwards = list.node.type === (nodeBefore === null || nodeBefore === void 0 ? void 0 : nodeBefore.type) && canJoin(tr2.doc, list.pos);
    if (!canJoinBackwards) {
      return true;
    }
    tr2.join(list.pos);
    return true;
  };
  var joinListForwards = (tr2, listType) => {
    const list = findParentNode((node) => node.type === listType)(tr2.selection);
    if (!list) {
      return true;
    }
    const after = tr2.doc.resolve(list.start).after(list.depth);
    if (after === void 0) {
      return true;
    }
    const nodeAfter = tr2.doc.nodeAt(after);
    const canJoinForwards = list.node.type === (nodeAfter === null || nodeAfter === void 0 ? void 0 : nodeAfter.type) && canJoin(tr2.doc, after);
    if (!canJoinForwards) {
      return true;
    }
    tr2.join(after);
    return true;
  };
  var toggleList = (listTypeOrName, itemTypeOrName, keepMarks, attributes = {}) => ({ editor, tr: tr2, state, dispatch, chain, commands: commands2, can }) => {
    const { extensions, splittableMarks } = editor.extensionManager;
    const listType = getNodeType(listTypeOrName, state.schema);
    const itemType = getNodeType(itemTypeOrName, state.schema);
    const { selection, storedMarks } = state;
    const { $from, $to } = selection;
    const range = $from.blockRange($to);
    const marks = storedMarks || selection.$to.parentOffset && selection.$from.marks();
    if (!range) {
      return false;
    }
    const parentList = findParentNode((node) => isList(node.type.name, extensions))(selection);
    if (range.depth >= 1 && parentList && range.depth - parentList.depth <= 1) {
      if (parentList.node.type === listType) {
        return commands2.liftListItem(itemType);
      }
      if (isList(parentList.node.type.name, extensions) && listType.validContent(parentList.node.content) && dispatch) {
        return chain().command(() => {
          tr2.setNodeMarkup(parentList.pos, listType);
          return true;
        }).command(() => joinListBackwards(tr2, listType)).command(() => joinListForwards(tr2, listType)).run();
      }
    }
    if (!keepMarks || !marks || !dispatch) {
      return chain().command(() => {
        const canWrapInList = can().wrapInList(listType, attributes);
        if (canWrapInList) {
          return true;
        }
        return commands2.clearNodes();
      }).wrapInList(listType, attributes).command(() => joinListBackwards(tr2, listType)).command(() => joinListForwards(tr2, listType)).run();
    }
    return chain().command(() => {
      const canWrapInList = can().wrapInList(listType, attributes);
      const filteredMarks = marks.filter((mark) => splittableMarks.includes(mark.type.name));
      tr2.ensureMarks(filteredMarks);
      if (canWrapInList) {
        return true;
      }
      return commands2.clearNodes();
    }).wrapInList(listType, attributes).command(() => joinListBackwards(tr2, listType)).command(() => joinListForwards(tr2, listType)).run();
  };
  var toggleMark = (typeOrName, attributes = {}, options = {}) => ({ state, commands: commands2 }) => {
    const { extendEmptyMarkRange = false } = options;
    const type = getMarkType(typeOrName, state.schema);
    const isActive = isMarkActive(state, type, attributes);
    if (isActive) {
      return commands2.unsetMark(type, { extendEmptyMarkRange });
    }
    return commands2.setMark(type, attributes);
  };
  var toggleNode = (typeOrName, toggleTypeOrName, attributes = {}) => ({ state, commands: commands2 }) => {
    const type = getNodeType(typeOrName, state.schema);
    const toggleType = getNodeType(toggleTypeOrName, state.schema);
    const isActive = isNodeActive(state, type, attributes);
    if (isActive) {
      return commands2.setNode(toggleType);
    }
    return commands2.setNode(type, attributes);
  };
  var toggleWrap = (typeOrName, attributes = {}) => ({ state, commands: commands2 }) => {
    const type = getNodeType(typeOrName, state.schema);
    const isActive = isNodeActive(state, type, attributes);
    if (isActive) {
      return commands2.lift(type);
    }
    return commands2.wrapIn(type, attributes);
  };
  var undoInputRule = () => ({ state, dispatch }) => {
    const plugins = state.plugins;
    for (let i = 0; i < plugins.length; i += 1) {
      const plugin = plugins[i];
      let undoable;
      if (plugin.spec.isInputRules && (undoable = plugin.getState(state))) {
        if (dispatch) {
          const tr2 = state.tr;
          const toUndo = undoable.transform;
          for (let j = toUndo.steps.length - 1; j >= 0; j -= 1) {
            tr2.step(toUndo.steps[j].invert(toUndo.docs[j]));
          }
          if (undoable.text) {
            const marks = tr2.doc.resolve(undoable.from).marks();
            tr2.replaceWith(undoable.from, undoable.to, state.schema.text(undoable.text, marks));
          } else {
            tr2.delete(undoable.from, undoable.to);
          }
        }
        return true;
      }
    }
    return false;
  };
  var unsetAllMarks = () => ({ tr: tr2, dispatch }) => {
    const { selection } = tr2;
    const { empty, ranges } = selection;
    if (empty) {
      return true;
    }
    if (dispatch) {
      ranges.forEach((range) => {
        tr2.removeMark(range.$from.pos, range.$to.pos);
      });
    }
    return true;
  };
  var unsetMark = (typeOrName, options = {}) => ({ tr: tr2, state, dispatch }) => {
    var _a;
    const { extendEmptyMarkRange = false } = options;
    const { selection } = tr2;
    const type = getMarkType(typeOrName, state.schema);
    const { $from, empty, ranges } = selection;
    if (!dispatch) {
      return true;
    }
    if (empty && extendEmptyMarkRange) {
      let { from, to } = selection;
      const attrs = (_a = $from.marks().find((mark) => mark.type === type)) === null || _a === void 0 ? void 0 : _a.attrs;
      const range = getMarkRange($from, type, attrs);
      if (range) {
        from = range.from;
        to = range.to;
      }
      tr2.removeMark(from, to, type);
    } else {
      ranges.forEach((range) => {
        tr2.removeMark(range.$from.pos, range.$to.pos, type);
      });
    }
    tr2.removeStoredMark(type);
    return true;
  };
  var updateAttributes = (typeOrName, attributes = {}) => ({ tr: tr2, state, dispatch }) => {
    let nodeType = null;
    let markType = null;
    const schemaType = getSchemaTypeNameByName(typeof typeOrName === "string" ? typeOrName : typeOrName.name, state.schema);
    if (!schemaType) {
      return false;
    }
    if (schemaType === "node") {
      nodeType = getNodeType(typeOrName, state.schema);
    }
    if (schemaType === "mark") {
      markType = getMarkType(typeOrName, state.schema);
    }
    if (dispatch) {
      tr2.selection.ranges.forEach((range) => {
        const from = range.$from.pos;
        const to = range.$to.pos;
        state.doc.nodesBetween(from, to, (node, pos) => {
          if (nodeType && nodeType === node.type) {
            tr2.setNodeMarkup(pos, void 0, {
              ...node.attrs,
              ...attributes
            });
          }
          if (markType && node.marks.length) {
            node.marks.forEach((mark) => {
              if (markType === mark.type) {
                const trimmedFrom = Math.max(pos, from);
                const trimmedTo = Math.min(pos + node.nodeSize, to);
                tr2.addMark(trimmedFrom, trimmedTo, markType.create({
                  ...mark.attrs,
                  ...attributes
                }));
              }
            });
          }
        });
      });
    }
    return true;
  };
  var wrapIn2 = (typeOrName, attributes = {}) => ({ state, dispatch }) => {
    const type = getNodeType(typeOrName, state.schema);
    return wrapIn(type, attributes)(state, dispatch);
  };
  var wrapInList2 = (typeOrName, attributes = {}) => ({ state, dispatch }) => {
    const type = getNodeType(typeOrName, state.schema);
    return wrapInList(type, attributes)(state, dispatch);
  };
  var commands = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    blur,
    clearContent,
    clearNodes,
    command,
    createParagraphNear: createParagraphNear2,
    cut,
    deleteCurrentNode,
    deleteNode,
    deleteRange: deleteRange2,
    deleteSelection: deleteSelection2,
    enter,
    exitCode: exitCode2,
    extendMarkRange,
    first,
    focus,
    forEach,
    insertContent,
    insertContentAt,
    joinUp: joinUp2,
    joinDown: joinDown2,
    joinBackward: joinBackward2,
    joinForward: joinForward2,
    joinItemBackward,
    joinItemForward,
    keyboardShortcut,
    lift: lift3,
    liftEmptyBlock: liftEmptyBlock2,
    liftListItem: liftListItem2,
    newlineInCode: newlineInCode2,
    resetAttributes,
    scrollIntoView,
    selectAll: selectAll2,
    selectNodeBackward: selectNodeBackward2,
    selectNodeForward: selectNodeForward2,
    selectParentNode: selectParentNode2,
    selectTextblockEnd: selectTextblockEnd2,
    selectTextblockStart: selectTextblockStart2,
    setContent,
    setMark,
    setMeta,
    setNode,
    setNodeSelection,
    setTextSelection,
    sinkListItem: sinkListItem2,
    splitBlock: splitBlock2,
    splitListItem,
    toggleList,
    toggleMark,
    toggleNode,
    toggleWrap,
    undoInputRule,
    unsetAllMarks,
    unsetMark,
    updateAttributes,
    wrapIn: wrapIn2,
    wrapInList: wrapInList2
  });
  var Commands = Extension.create({
    name: "commands",
    addCommands() {
      return {
        ...commands
      };
    }
  });
  var Editable = Extension.create({
    name: "editable",
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey("editable"),
          props: {
            editable: () => this.editor.options.editable
          }
        })
      ];
    }
  });
  var FocusEvents = Extension.create({
    name: "focusEvents",
    addProseMirrorPlugins() {
      const { editor } = this;
      return [
        new Plugin({
          key: new PluginKey("focusEvents"),
          props: {
            handleDOMEvents: {
              focus: (view, event) => {
                editor.isFocused = true;
                const transaction = editor.state.tr.setMeta("focus", { event }).setMeta("addToHistory", false);
                view.dispatch(transaction);
                return false;
              },
              blur: (view, event) => {
                editor.isFocused = false;
                const transaction = editor.state.tr.setMeta("blur", { event }).setMeta("addToHistory", false);
                view.dispatch(transaction);
                return false;
              }
            }
          }
        })
      ];
    }
  });
  var Keymap = Extension.create({
    name: "keymap",
    addKeyboardShortcuts() {
      const handleBackspace = () => this.editor.commands.first(({ commands: commands2 }) => [
        () => commands2.undoInputRule(),
        // maybe convert first text block node to default node
        () => commands2.command(({ tr: tr2 }) => {
          const { selection, doc } = tr2;
          const { empty, $anchor } = selection;
          const { pos, parent } = $anchor;
          const $parentPos = $anchor.parent.isTextblock ? tr2.doc.resolve(pos - 1) : $anchor;
          const parentIsIsolating = $parentPos.parent.type.spec.isolating;
          const parentPos = $anchor.pos - $anchor.parentOffset;
          const isAtStart = parentIsIsolating && $parentPos.parent.childCount === 1 ? parentPos === $anchor.pos : Selection.atStart(doc).from === pos;
          if (!empty || !isAtStart || !parent.type.isTextblock || parent.textContent.length) {
            return false;
          }
          return commands2.clearNodes();
        }),
        () => commands2.deleteSelection(),
        () => commands2.joinBackward(),
        () => commands2.selectNodeBackward()
      ]);
      const handleDelete = () => this.editor.commands.first(({ commands: commands2 }) => [
        () => commands2.deleteSelection(),
        () => commands2.deleteCurrentNode(),
        () => commands2.joinForward(),
        () => commands2.selectNodeForward()
      ]);
      const handleEnter = () => this.editor.commands.first(({ commands: commands2 }) => [
        () => commands2.newlineInCode(),
        () => commands2.createParagraphNear(),
        () => commands2.liftEmptyBlock(),
        () => commands2.splitBlock()
      ]);
      const baseKeymap = {
        Enter: handleEnter,
        "Mod-Enter": () => this.editor.commands.exitCode(),
        Backspace: handleBackspace,
        "Mod-Backspace": handleBackspace,
        "Shift-Backspace": handleBackspace,
        Delete: handleDelete,
        "Mod-Delete": handleDelete,
        "Mod-a": () => this.editor.commands.selectAll()
      };
      const pcKeymap = {
        ...baseKeymap
      };
      const macKeymap = {
        ...baseKeymap,
        "Ctrl-h": handleBackspace,
        "Alt-Backspace": handleBackspace,
        "Ctrl-d": handleDelete,
        "Ctrl-Alt-Backspace": handleDelete,
        "Alt-Delete": handleDelete,
        "Alt-d": handleDelete,
        "Ctrl-a": () => this.editor.commands.selectTextblockStart(),
        "Ctrl-e": () => this.editor.commands.selectTextblockEnd()
      };
      if (isiOS() || isMacOS()) {
        return macKeymap;
      }
      return pcKeymap;
    },
    addProseMirrorPlugins() {
      return [
        // With this plugin we check if the whole document was selected and deleted.
        // In this case we will additionally call `clearNodes()` to convert e.g. a heading
        // to a paragraph if necessary.
        // This is an alternative to ProseMirror's `AllSelection`, which doesn’t work well
        // with many other commands.
        new Plugin({
          key: new PluginKey("clearDocument"),
          appendTransaction: (transactions, oldState, newState) => {
            const docChanges = transactions.some((transaction) => transaction.docChanged) && !oldState.doc.eq(newState.doc);
            if (!docChanges) {
              return;
            }
            const { empty, from, to } = oldState.selection;
            const allFrom = Selection.atStart(oldState.doc).from;
            const allEnd = Selection.atEnd(oldState.doc).to;
            const allWasSelected = from === allFrom && to === allEnd;
            if (empty || !allWasSelected) {
              return;
            }
            const isEmpty = newState.doc.textBetween(0, newState.doc.content.size, " ", " ").length === 0;
            if (!isEmpty) {
              return;
            }
            const tr2 = newState.tr;
            const state = createChainableState({
              state: newState,
              transaction: tr2
            });
            const { commands: commands2 } = new CommandManager({
              editor: this.editor,
              state
            });
            commands2.clearNodes();
            if (!tr2.steps.length) {
              return;
            }
            return tr2;
          }
        })
      ];
    }
  });
  var Tabindex = Extension.create({
    name: "tabindex",
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey("tabindex"),
          props: {
            attributes: this.editor.isEditable ? { tabindex: "0" } : {}
          }
        })
      ];
    }
  });
  var Mark2 = class _Mark {
    constructor(config = {}) {
      this.type = "mark";
      this.name = "mark";
      this.parent = null;
      this.child = null;
      this.config = {
        name: this.name,
        defaultOptions: {}
      };
      this.config = {
        ...this.config,
        ...config
      };
      this.name = this.config.name;
      if (config.defaultOptions) {
        console.warn(`[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${this.name}".`);
      }
      this.options = this.config.defaultOptions;
      if (this.config.addOptions) {
        this.options = callOrReturn(getExtensionField(this, "addOptions", {
          name: this.name
        }));
      }
      this.storage = callOrReturn(getExtensionField(this, "addStorage", {
        name: this.name,
        options: this.options
      })) || {};
    }
    static create(config = {}) {
      return new _Mark(config);
    }
    configure(options = {}) {
      const extension = this.extend();
      extension.options = mergeDeep(this.options, options);
      extension.storage = callOrReturn(getExtensionField(extension, "addStorage", {
        name: extension.name,
        options: extension.options
      }));
      return extension;
    }
    extend(extendedConfig = {}) {
      const extension = new _Mark(extendedConfig);
      extension.parent = this;
      this.child = extension;
      extension.name = extendedConfig.name ? extendedConfig.name : extension.parent.name;
      if (extendedConfig.defaultOptions) {
        console.warn(`[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${extension.name}".`);
      }
      extension.options = callOrReturn(getExtensionField(extension, "addOptions", {
        name: extension.name
      }));
      extension.storage = callOrReturn(getExtensionField(extension, "addStorage", {
        name: extension.name,
        options: extension.options
      }));
      return extension;
    }
    static handleExit({ editor, mark }) {
      const { tr: tr2 } = editor.state;
      const currentPos = editor.state.selection.$from;
      const isAtEnd = currentPos.pos === currentPos.end();
      if (isAtEnd) {
        const currentMarks = currentPos.marks();
        const isInMark = !!currentMarks.find((m) => (m === null || m === void 0 ? void 0 : m.type.name) === mark.name);
        if (!isInMark) {
          return false;
        }
        const removeMark2 = currentMarks.find((m) => (m === null || m === void 0 ? void 0 : m.type.name) === mark.name);
        if (removeMark2) {
          tr2.removeStoredMark(removeMark2);
        }
        tr2.insertText(" ", currentPos.pos);
        editor.view.dispatch(tr2);
        return true;
      }
      return false;
    }
  };

  // node_modules/linkifyjs/dist/linkify.es.js
  var encodedTlds = "aaa1rp3barth4b0ott3vie4c1le2ogado5udhabi7c0ademy5centure6ountant0s9o1tor4d0s1ult4e0g1ro2tna4f0l1rica5g0akhan5ency5i0g1rbus3force5tel5kdn3l0faromeo7ibaba4pay4lfinanz6state5y2sace3tom5m0azon4ericanexpress7family11x2fam3ica3sterdam8nalytics7droid5quan4z2o0l2partments8p0le4q0uarelle8r0ab1mco4chi3my2pa2t0e3s0da2ia2sociates9t0hleta5torney7u0ction5di0ble3o3spost5thor3o0s4vianca6w0s2x0a2z0ure5ba0by2idu3namex3narepublic11d1k2r0celona5laycard4s5efoot5gains6seball5ketball8uhaus5yern5b0c1t1va3cg1n2d1e0ats2uty4er2ntley5rlin4st0buy5t2f1g1h0arti5i0ble3d1ke2ng0o3o1z2j1lack0friday9ockbuster8g1omberg7ue3m0s1w2n0pparibas9o0ats3ehringer8fa2m1nd2o0k0ing5sch2tik2on4t1utique6x2r0adesco6idgestone9oadway5ker3ther5ussels7s1t1uild0ers6siness6y1zz3v1w1y1z0h3ca0b1fe2l0l1vinklein9m0era3p2non3petown5ital0one8r0avan4ds2e0er0s4s2sa1e1h1ino4t0ering5holic7ba1n1re2s2c1d1enter4o1rn3f0a1d2g1h0anel2nel4rity4se2t2eap3intai5ristmas6ome4urch5i0priani6rcle4sco3tadel4i0c2y0eats7k1l0aims4eaning6ick2nic1que6othing5ud3ub0med6m1n1o0ach3des3ffee4llege4ogne5m0cast4mbank4unity6pany2re3uter5sec4ndos3struction8ulting7tact3ractors9oking0channel11l1p2rsica5untry4pon0s4rses6pa2r0edit0card4union9icket5own3s1uise0s6u0isinella9v1w1x1y0mru3ou3z2dabur3d1nce3ta1e1ing3sun4y2clk3ds2e0al0er2s3gree4livery5l1oitte5ta3mocrat6ntal2ist5si0gn4v2hl2iamonds6et2gital5rect0ory7scount3ver5h2y2j1k1m1np2o0cs1tor4g1mains5t1wnload7rive4tv2ubai3nlop4pont4rban5vag2r2z2earth3t2c0o2deka3u0cation8e1g1mail3erck5nergy4gineer0ing9terprises10pson4quipment8r0icsson6ni3s0q1tate5t0isalat7u0rovision8s2vents5xchange6pert3osed4ress5traspace10fage2il1rwinds6th3mily4n0s2rm0ers5shion4t3edex3edback6rrari3ero6i0at2delity5o2lm2nal1nce1ial7re0stone6mdale6sh0ing5t0ness6j1k1lickr3ghts4r2orist4wers5y2m1o0o0d0network8tball6rd1ex2sale4um3undation8x2r0ee1senius7l1ogans4ntdoor4ier7tr2ujitsu5n0d2rniture7tbol5yi3ga0l0lery3o1up4me0s3p1rden4y2b0iz3d0n2e0a1nt0ing5orge5f1g0ee3h1i0ft0s3ves2ing5l0ass3e1obal2o4m0ail3bh2o1x2n1odaddy5ld0point6f2o0dyear5g0le4p1t1v2p1q1r0ainger5phics5tis4een3ipe3ocery4up4s1t1u0ardian6cci3ge2ide2tars5ru3w1y2hair2mburg5ngout5us3bo2dfc0bank7ealth0care8lp1sinki6re1mes5gtv3iphop4samitsu7tachi5v2k0t2m1n1ockey4ldings5iday5medepot5goods5s0ense7nda3rse3spital5t0ing5t0eles2s3mail5use3w2r1sbc3t1u0ghes5yatt3undai7ibm2cbc2e1u2d1e0ee3fm2kano4l1m0amat4db2mo0bilien9n0c1dustries8finiti5o2g1k1stitute6urance4e4t0ernational10uit4vestments10o1piranga7q1r0ish4s0maili5t0anbul7t0au2v3jaguar4va3cb2e0ep2tzt3welry6io2ll2m0p2nj2o0bs1urg4t1y2p0morgan6rs3uegos4niper7kaufen5ddi3e0rryhotels6logistics9properties14fh2g1h1i0a1ds2m1nder2le4tchen5wi3m1n1oeln3matsu5sher5p0mg2n2r0d1ed3uokgroup8w1y0oto4z2la0caixa5mborghini8er3ncaster5ia3d0rover6xess5salle5t0ino3robe5w0yer5b1c1ds2ease3clerc5frak4gal2o2xus4gbt3i0dl2fe0insurance9style7ghting6ke2lly3mited4o2ncoln4de2k2psy3ve1ing5k1lc1p2oan0s3cker3us3l1ndon4tte1o3ve3pl0financial11r1s1t0d0a3u0ndbeck6xe1ury5v1y2ma0cys3drid4if1son4keup4n0agement7go3p1rket0ing3s4riott5shalls7serati6ttel5ba2c0kinsey7d1e0d0ia3et2lbourne7me1orial6n0u2rckmsd7g1h1iami3crosoft7l1ni1t2t0subishi9k1l0b1s2m0a2n1o0bi0le4da2e1i1m1nash3ey2ster5rmon3tgage6scow4to0rcycles9v0ie4p1q1r1s0d2t0n1r2u0seum3ic3tual5v1w1x1y1z2na0b1goya4me2tura4vy3ba2c1e0c1t0bank4flix4work5ustar5w0s2xt0direct7us4f0l2g0o2hk2i0co2ke1on3nja3ssan1y5l1o0kia3rthwesternmutual14on4w0ruz3tv4p1r0a1w2tt2u1yc2z2obi1server7ffice5kinawa6layan0group9dnavy5lo3m0ega4ne1g1l0ine5oo2pen3racle3nge4g0anic5igins6saka4tsuka4t2vh3pa0ge2nasonic7ris2s1tners4s1y3ssagens7y2ccw3e0t2f0izer5g1h0armacy6d1ilips5one2to0graphy6s4ysio5ics1tet2ures6d1n0g1k2oneer5zza4k1l0ace2y0station9umbing5s3m1n0c2ohl2ker3litie5rn2st3r0america6xi3ess3ime3o0d0uctions8f1gressive8mo2perties3y5tection8u0dential9s1t1ub2w0c2y2qa1pon3uebec3st5racing4dio4e0ad1lestate6tor2y4cipes5d0stone5umbrella9hab3ise0n3t2liance6n0t0als5pair3ort3ublican8st0aurant8view0s5xroth6ich0ardli6oh3l1o1p2o0cher3ks3deo3gers4om3s0vp3u0gby3hr2n2w0e2yukyu6sa0arland6fe0ty4kura4le1on3msclub4ung5ndvik0coromant12ofi4p1rl2s1ve2xo3b0i1s2c0a1b1haeffler7midt4olarships8ol3ule3warz5ience5ot3d1e0arch3t2cure1ity6ek2lect4ner3rvices6ven3w1x0y3fr2g1h0angrila6rp2w2ell3ia1ksha5oes2p0ping5uji3w0time7i0lk2na1gles5te3j1k0i0n2y0pe4l0ing4m0art3ile4n0cf3o0ccer3ial4ftbank4ware6hu2lar2utions7ng1y2y2pa0ce3ort2t3r0l2s1t0ada2ples4r1tebank4farm7c0group6ockholm6rage3e3ream4udio2y3yle4u0cks3pplies3y2ort5rf1gery5zuki5v1watch4iss4x1y0dney4stems6z2tab1ipei4lk2obao4rget4tamotors6r2too4x0i3c0i2d0k2eam2ch0nology8l1masek5nnis4va3f1g1h0d1eater2re6iaa2ckets5enda4ffany5ps2res2ol4j0maxx4x2k0maxx5l1m0all4n1o0day3kyo3ols3p1ray3shiba5tal3urs3wn2yota3s3r0ade1ing4ining5vel0channel7ers0insurance16ust3v2t1ube2i1nes3shu4v0s2w1z2ua1bank3s2g1k1nicom3versity8o2ol2ps2s1y1z2va0cations7na1guard7c1e0gas3ntures6risign5m\xF6gensberater2ung14sicherung10t2g1i0ajes4deo3g1king4llas4n1p1rgin4sa1ion4va1o3laanderen9n1odka3lkswagen7vo3te1ing3o2yage5u0elos6wales2mart4ter4ng0gou5tch0es6eather0channel12bcam3er2site5d0ding5ibo2r3f1hoswho6ien2ki2lliamhill9n0dows4e1ners6me2olterskluwer11odside6rk0s2ld3w2s1tc1f3xbox3erox4finity6ihuan4n2xx2yz3yachts4hoo3maxun5ndex5e1odobashi7ga2kohama6u0tube6t1un3za0ppos4ra3ero3ip2m1one3uerich6w2";
  var encodedUtlds = "\u03B5\u03BB1\u03C52\u0431\u04331\u0435\u043B3\u0434\u0435\u0442\u04384\u0435\u044E2\u043A\u0430\u0442\u043E\u043B\u0438\u043A6\u043E\u043C3\u043C\u043A\u04342\u043E\u043D1\u0441\u043A\u0432\u04306\u043E\u043D\u043B\u0430\u0439\u043D5\u0440\u04333\u0440\u0443\u04412\u04442\u0441\u0430\u0439\u04423\u0440\u04313\u0443\u043A\u04403\u049B\u0430\u04373\u0570\u0561\u05753\u05D9\u05E9\u05E8\u05D0\u05DC5\u05E7\u05D5\u05DD3\u0627\u0628\u0648\u0638\u0628\u064A5\u062A\u0635\u0627\u0644\u0627\u062A6\u0631\u0627\u0645\u0643\u06485\u0644\u0627\u0631\u062F\u06464\u0628\u062D\u0631\u064A\u06465\u062C\u0632\u0627\u0626\u06315\u0633\u0639\u0648\u062F\u064A\u06296\u0639\u0644\u064A\u0627\u06465\u0645\u063A\u0631\u06285\u0645\u0627\u0631\u0627\u062A5\u06CC\u0631\u0627\u06465\u0628\u0627\u0631\u062A2\u0632\u0627\u06314\u064A\u062A\u06433\u06BE\u0627\u0631\u062A5\u062A\u0648\u0646\u06334\u0633\u0648\u062F\u0627\u06463\u0631\u064A\u06295\u0634\u0628\u0643\u06294\u0639\u0631\u0627\u06422\u06282\u0645\u0627\u06464\u0641\u0644\u0633\u0637\u064A\u06466\u0642\u0637\u06313\u0643\u0627\u062B\u0648\u0644\u064A\u06436\u0648\u06453\u0645\u0635\u06312\u0644\u064A\u0633\u064A\u06275\u0648\u0631\u064A\u062A\u0627\u0646\u064A\u06277\u0642\u06394\u0647\u0645\u0631\u0627\u06475\u067E\u0627\u06A9\u0633\u062A\u0627\u06467\u0680\u0627\u0631\u062A4\u0915\u0949\u092E3\u0928\u0947\u091F3\u092D\u093E\u0930\u09240\u092E\u094D3\u094B\u09245\u0938\u0902\u0917\u0920\u09285\u09AC\u09BE\u0982\u09B2\u09BE5\u09AD\u09BE\u09B0\u09A42\u09F0\u09A44\u0A2D\u0A3E\u0A30\u0A244\u0AAD\u0ABE\u0AB0\u0AA44\u0B2D\u0B3E\u0B30\u0B244\u0B87\u0BA8\u0BCD\u0BA4\u0BBF\u0BAF\u0BBE6\u0BB2\u0B99\u0BCD\u0B95\u0BC86\u0B9A\u0BBF\u0B99\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0BC2\u0BB0\u0BCD11\u0C2D\u0C3E\u0C30\u0C24\u0C4D5\u0CAD\u0CBE\u0CB0\u0CA44\u0D2D\u0D3E\u0D30\u0D24\u0D025\u0DBD\u0D82\u0D9A\u0DCF4\u0E04\u0E2D\u0E213\u0E44\u0E17\u0E223\u0EA5\u0EB2\u0EA73\u10D2\u10D42\u307F\u3093\u306A3\u30A2\u30DE\u30BE\u30F34\u30AF\u30E9\u30A6\u30C94\u30B0\u30FC\u30B0\u30EB4\u30B3\u30E02\u30B9\u30C8\u30A23\u30BB\u30FC\u30EB3\u30D5\u30A1\u30C3\u30B7\u30E7\u30F36\u30DD\u30A4\u30F3\u30C84\u4E16\u754C2\u4E2D\u4FE11\u56FD1\u570B1\u6587\u7F513\u4E9A\u9A6C\u900A3\u4F01\u4E1A2\u4F5B\u5C712\u4FE1\u606F2\u5065\u5EB72\u516B\u53662\u516C\u53F81\u76CA2\u53F0\u6E7E1\u70632\u5546\u57CE1\u5E971\u68072\u5609\u91CC0\u5927\u9152\u5E975\u5728\u7EBF2\u5927\u62FF2\u5929\u4E3B\u65593\u5A31\u4E502\u5BB6\u96FB2\u5E7F\u4E1C2\u5FAE\u535A2\u6148\u55842\u6211\u7231\u4F603\u624B\u673A2\u62DB\u80582\u653F\u52A11\u5E9C2\u65B0\u52A0\u57612\u95FB2\u65F6\u5C1A2\u66F8\u7C4D2\u673A\u67842\u6DE1\u9A6C\u95213\u6E38\u620F2\u6FB3\u95802\u70B9\u770B2\u79FB\u52A82\u7EC4\u7EC7\u673A\u67844\u7F51\u57401\u5E971\u7AD91\u7EDC2\u8054\u901A2\u8C37\u6B4C2\u8D2D\u72692\u901A\u8CA92\u96C6\u56E22\u96FB\u8A0A\u76C8\u79D14\u98DE\u5229\u6D663\u98DF\u54C12\u9910\u53852\u9999\u683C\u91CC\u62C93\u6E2F2\uB2F7\uB1371\uCEF42\uC0BC\uC1312\uD55C\uAD6D2";
  var assign = (target, properties) => {
    for (const key in properties) {
      target[key] = properties[key];
    }
    return target;
  };
  var numeric = "numeric";
  var ascii = "ascii";
  var alpha = "alpha";
  var asciinumeric = "asciinumeric";
  var alphanumeric = "alphanumeric";
  var domain = "domain";
  var emoji = "emoji";
  var scheme = "scheme";
  var slashscheme = "slashscheme";
  var whitespace = "whitespace";
  function registerGroup(name, groups) {
    if (!(name in groups)) {
      groups[name] = [];
    }
    return groups[name];
  }
  function addToGroups(t, flags, groups) {
    if (flags[numeric]) {
      flags[asciinumeric] = true;
      flags[alphanumeric] = true;
    }
    if (flags[ascii]) {
      flags[asciinumeric] = true;
      flags[alpha] = true;
    }
    if (flags[asciinumeric]) {
      flags[alphanumeric] = true;
    }
    if (flags[alpha]) {
      flags[alphanumeric] = true;
    }
    if (flags[alphanumeric]) {
      flags[domain] = true;
    }
    if (flags[emoji]) {
      flags[domain] = true;
    }
    for (const k in flags) {
      const group = registerGroup(k, groups);
      if (group.indexOf(t) < 0) {
        group.push(t);
      }
    }
  }
  function flagsForToken(t, groups) {
    const result = {};
    for (const c in groups) {
      if (groups[c].indexOf(t) >= 0) {
        result[c] = true;
      }
    }
    return result;
  }
  function State(token) {
    if (token === void 0) {
      token = null;
    }
    this.j = {};
    this.jr = [];
    this.jd = null;
    this.t = token;
  }
  State.groups = {};
  State.prototype = {
    accepts() {
      return !!this.t;
    },
    /**
     * Follow an existing transition from the given input to the next state.
     * Does not mutate.
     * @param {string} input character or token type to transition on
     * @returns {?State<T>} the next state, if any
     */
    go(input) {
      const state = this;
      const nextState = state.j[input];
      if (nextState) {
        return nextState;
      }
      for (let i = 0; i < state.jr.length; i++) {
        const regex = state.jr[i][0];
        const nextState2 = state.jr[i][1];
        if (nextState2 && regex.test(input)) {
          return nextState2;
        }
      }
      return state.jd;
    },
    /**
     * Whether the state has a transition for the given input. Set the second
     * argument to true to only look for an exact match (and not a default or
     * regular-expression-based transition)
     * @param {string} input
     * @param {boolean} exactOnly
     */
    has(input, exactOnly) {
      if (exactOnly === void 0) {
        exactOnly = false;
      }
      return exactOnly ? input in this.j : !!this.go(input);
    },
    /**
     * Short for "transition all"; create a transition from the array of items
     * in the given list to the same final resulting state.
     * @param {string | string[]} inputs Group of inputs to transition on
     * @param {Transition<T> | State<T>} [next] Transition options
     * @param {Flags} [flags] Collections flags to add token to
     * @param {Collections<T>} [groups] Master list of token groups
     */
    ta(inputs, next, flags, groups) {
      for (let i = 0; i < inputs.length; i++) {
        this.tt(inputs[i], next, flags, groups);
      }
    },
    /**
     * Short for "take regexp transition"; defines a transition for this state
     * when it encounters a token which matches the given regular expression
     * @param {RegExp} regexp Regular expression transition (populate first)
     * @param {T | State<T>} [next] Transition options
     * @param {Flags} [flags] Collections flags to add token to
     * @param {Collections<T>} [groups] Master list of token groups
     * @returns {State<T>} taken after the given input
     */
    tr(regexp, next, flags, groups) {
      groups = groups || State.groups;
      let nextState;
      if (next && next.j) {
        nextState = next;
      } else {
        nextState = new State(next);
        if (flags && groups) {
          addToGroups(next, flags, groups);
        }
      }
      this.jr.push([regexp, nextState]);
      return nextState;
    },
    /**
     * Short for "take transitions", will take as many sequential transitions as
     * the length of the given input and returns the
     * resulting final state.
     * @param {string | string[]} input
     * @param {T | State<T>} [next] Transition options
     * @param {Flags} [flags] Collections flags to add token to
     * @param {Collections<T>} [groups] Master list of token groups
     * @returns {State<T>} taken after the given input
     */
    ts(input, next, flags, groups) {
      let state = this;
      const len = input.length;
      if (!len) {
        return state;
      }
      for (let i = 0; i < len - 1; i++) {
        state = state.tt(input[i]);
      }
      return state.tt(input[len - 1], next, flags, groups);
    },
    /**
     * Short for "take transition", this is a method for building/working with
     * state machines.
     *
     * If a state already exists for the given input, returns it.
     *
     * If a token is specified, that state will emit that token when reached by
     * the linkify engine.
     *
     * If no state exists, it will be initialized with some default transitions
     * that resemble existing default transitions.
     *
     * If a state is given for the second argument, that state will be
     * transitioned to on the given input regardless of what that input
     * previously did.
     *
     * Specify a token group flags to define groups that this token belongs to.
     * The token will be added to corresponding entires in the given groups
     * object.
     *
     * @param {string} input character, token type to transition on
     * @param {T | State<T>} [next] Transition options
     * @param {Flags} [flags] Collections flags to add token to
     * @param {Collections<T>} [groups] Master list of groups
     * @returns {State<T>} taken after the given input
     */
    tt(input, next, flags, groups) {
      groups = groups || State.groups;
      const state = this;
      if (next && next.j) {
        state.j[input] = next;
        return next;
      }
      const t = next;
      let nextState, templateState = state.go(input);
      if (templateState) {
        nextState = new State();
        assign(nextState.j, templateState.j);
        nextState.jr.push.apply(nextState.jr, templateState.jr);
        nextState.jd = templateState.jd;
        nextState.t = templateState.t;
      } else {
        nextState = new State();
      }
      if (t) {
        if (groups) {
          if (nextState.t && typeof nextState.t === "string") {
            const allFlags = assign(flagsForToken(nextState.t, groups), flags);
            addToGroups(t, allFlags, groups);
          } else if (flags) {
            addToGroups(t, flags, groups);
          }
        }
        nextState.t = t;
      }
      state.j[input] = nextState;
      return nextState;
    }
  };
  var ta = (state, input, next, flags, groups) => state.ta(input, next, flags, groups);
  var tr = (state, regexp, next, flags, groups) => state.tr(regexp, next, flags, groups);
  var ts = (state, input, next, flags, groups) => state.ts(input, next, flags, groups);
  var tt = (state, input, next, flags, groups) => state.tt(input, next, flags, groups);
  var WORD = "WORD";
  var UWORD = "UWORD";
  var LOCALHOST = "LOCALHOST";
  var TLD = "TLD";
  var UTLD = "UTLD";
  var SCHEME = "SCHEME";
  var SLASH_SCHEME = "SLASH_SCHEME";
  var NUM = "NUM";
  var WS = "WS";
  var NL$1 = "NL";
  var OPENBRACE = "OPENBRACE";
  var OPENBRACKET = "OPENBRACKET";
  var OPENANGLEBRACKET = "OPENANGLEBRACKET";
  var OPENPAREN = "OPENPAREN";
  var CLOSEBRACE = "CLOSEBRACE";
  var CLOSEBRACKET = "CLOSEBRACKET";
  var CLOSEANGLEBRACKET = "CLOSEANGLEBRACKET";
  var CLOSEPAREN = "CLOSEPAREN";
  var AMPERSAND = "AMPERSAND";
  var APOSTROPHE = "APOSTROPHE";
  var ASTERISK = "ASTERISK";
  var AT = "AT";
  var BACKSLASH = "BACKSLASH";
  var BACKTICK = "BACKTICK";
  var CARET = "CARET";
  var COLON = "COLON";
  var COMMA = "COMMA";
  var DOLLAR = "DOLLAR";
  var DOT = "DOT";
  var EQUALS = "EQUALS";
  var EXCLAMATION = "EXCLAMATION";
  var HYPHEN = "HYPHEN";
  var PERCENT = "PERCENT";
  var PIPE = "PIPE";
  var PLUS = "PLUS";
  var POUND = "POUND";
  var QUERY = "QUERY";
  var QUOTE = "QUOTE";
  var SEMI = "SEMI";
  var SLASH = "SLASH";
  var TILDE = "TILDE";
  var UNDERSCORE = "UNDERSCORE";
  var EMOJI$1 = "EMOJI";
  var SYM = "SYM";
  var tk = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    WORD,
    UWORD,
    LOCALHOST,
    TLD,
    UTLD,
    SCHEME,
    SLASH_SCHEME,
    NUM,
    WS,
    NL: NL$1,
    OPENBRACE,
    OPENBRACKET,
    OPENANGLEBRACKET,
    OPENPAREN,
    CLOSEBRACE,
    CLOSEBRACKET,
    CLOSEANGLEBRACKET,
    CLOSEPAREN,
    AMPERSAND,
    APOSTROPHE,
    ASTERISK,
    AT,
    BACKSLASH,
    BACKTICK,
    CARET,
    COLON,
    COMMA,
    DOLLAR,
    DOT,
    EQUALS,
    EXCLAMATION,
    HYPHEN,
    PERCENT,
    PIPE,
    PLUS,
    POUND,
    QUERY,
    QUOTE,
    SEMI,
    SLASH,
    TILDE,
    UNDERSCORE,
    EMOJI: EMOJI$1,
    SYM
  });
  var ASCII_LETTER = /[a-z]/;
  var LETTER = /\p{L}/u;
  var EMOJI = /\p{Emoji}/u;
  var DIGIT = /\d/;
  var SPACE = /\s/;
  var NL = "\n";
  var EMOJI_VARIATION = "\uFE0F";
  var EMOJI_JOINER = "\u200D";
  var tlds = null;
  var utlds = null;
  function init$2(customSchemes) {
    if (customSchemes === void 0) {
      customSchemes = [];
    }
    const groups = {};
    State.groups = groups;
    const Start = new State();
    if (tlds == null) {
      tlds = decodeTlds(encodedTlds);
    }
    if (utlds == null) {
      utlds = decodeTlds(encodedUtlds);
    }
    tt(Start, "'", APOSTROPHE);
    tt(Start, "{", OPENBRACE);
    tt(Start, "[", OPENBRACKET);
    tt(Start, "<", OPENANGLEBRACKET);
    tt(Start, "(", OPENPAREN);
    tt(Start, "}", CLOSEBRACE);
    tt(Start, "]", CLOSEBRACKET);
    tt(Start, ">", CLOSEANGLEBRACKET);
    tt(Start, ")", CLOSEPAREN);
    tt(Start, "&", AMPERSAND);
    tt(Start, "*", ASTERISK);
    tt(Start, "@", AT);
    tt(Start, "`", BACKTICK);
    tt(Start, "^", CARET);
    tt(Start, ":", COLON);
    tt(Start, ",", COMMA);
    tt(Start, "$", DOLLAR);
    tt(Start, ".", DOT);
    tt(Start, "=", EQUALS);
    tt(Start, "!", EXCLAMATION);
    tt(Start, "-", HYPHEN);
    tt(Start, "%", PERCENT);
    tt(Start, "|", PIPE);
    tt(Start, "+", PLUS);
    tt(Start, "#", POUND);
    tt(Start, "?", QUERY);
    tt(Start, '"', QUOTE);
    tt(Start, "/", SLASH);
    tt(Start, ";", SEMI);
    tt(Start, "~", TILDE);
    tt(Start, "_", UNDERSCORE);
    tt(Start, "\\", BACKSLASH);
    const Num = tr(Start, DIGIT, NUM, {
      [numeric]: true
    });
    tr(Num, DIGIT, Num);
    const Word = tr(Start, ASCII_LETTER, WORD, {
      [ascii]: true
    });
    tr(Word, ASCII_LETTER, Word);
    const UWord = tr(Start, LETTER, UWORD, {
      [alpha]: true
    });
    tr(UWord, ASCII_LETTER);
    tr(UWord, LETTER, UWord);
    const Ws = tr(Start, SPACE, WS, {
      [whitespace]: true
    });
    tt(Start, NL, NL$1, {
      [whitespace]: true
    });
    tt(Ws, NL);
    tr(Ws, SPACE, Ws);
    const Emoji = tr(Start, EMOJI, EMOJI$1, {
      [emoji]: true
    });
    tr(Emoji, EMOJI, Emoji);
    tt(Emoji, EMOJI_VARIATION, Emoji);
    const EmojiJoiner = tt(Emoji, EMOJI_JOINER);
    tr(EmojiJoiner, EMOJI, Emoji);
    const wordjr = [[ASCII_LETTER, Word]];
    const uwordjr = [[ASCII_LETTER, null], [LETTER, UWord]];
    for (let i = 0; i < tlds.length; i++) {
      fastts(Start, tlds[i], TLD, WORD, wordjr);
    }
    for (let i = 0; i < utlds.length; i++) {
      fastts(Start, utlds[i], UTLD, UWORD, uwordjr);
    }
    addToGroups(TLD, {
      tld: true,
      ascii: true
    }, groups);
    addToGroups(UTLD, {
      utld: true,
      alpha: true
    }, groups);
    fastts(Start, "file", SCHEME, WORD, wordjr);
    fastts(Start, "mailto", SCHEME, WORD, wordjr);
    fastts(Start, "http", SLASH_SCHEME, WORD, wordjr);
    fastts(Start, "https", SLASH_SCHEME, WORD, wordjr);
    fastts(Start, "ftp", SLASH_SCHEME, WORD, wordjr);
    fastts(Start, "ftps", SLASH_SCHEME, WORD, wordjr);
    addToGroups(SCHEME, {
      scheme: true,
      ascii: true
    }, groups);
    addToGroups(SLASH_SCHEME, {
      slashscheme: true,
      ascii: true
    }, groups);
    customSchemes = customSchemes.sort((a, b) => a[0] > b[0] ? 1 : -1);
    for (let i = 0; i < customSchemes.length; i++) {
      const sch = customSchemes[i][0];
      const optionalSlashSlash = customSchemes[i][1];
      const flags = optionalSlashSlash ? {
        [scheme]: true
      } : {
        [slashscheme]: true
      };
      if (sch.indexOf("-") >= 0) {
        flags[domain] = true;
      } else if (!ASCII_LETTER.test(sch)) {
        flags[numeric] = true;
      } else if (DIGIT.test(sch)) {
        flags[asciinumeric] = true;
      } else {
        flags[ascii] = true;
      }
      ts(Start, sch, sch, flags);
    }
    ts(Start, "localhost", LOCALHOST, {
      ascii: true
    });
    Start.jd = new State(SYM);
    return {
      start: Start,
      tokens: assign({
        groups
      }, tk)
    };
  }
  function run$1(start, str) {
    const iterable = stringToArray(str.replace(/[A-Z]/g, (c) => c.toLowerCase()));
    const charCount = iterable.length;
    const tokens = [];
    let cursor = 0;
    let charCursor = 0;
    while (charCursor < charCount) {
      let state = start;
      let nextState = null;
      let tokenLength = 0;
      let latestAccepting = null;
      let sinceAccepts = -1;
      let charsSinceAccepts = -1;
      while (charCursor < charCount && (nextState = state.go(iterable[charCursor]))) {
        state = nextState;
        if (state.accepts()) {
          sinceAccepts = 0;
          charsSinceAccepts = 0;
          latestAccepting = state;
        } else if (sinceAccepts >= 0) {
          sinceAccepts += iterable[charCursor].length;
          charsSinceAccepts++;
        }
        tokenLength += iterable[charCursor].length;
        cursor += iterable[charCursor].length;
        charCursor++;
      }
      cursor -= sinceAccepts;
      charCursor -= charsSinceAccepts;
      tokenLength -= sinceAccepts;
      tokens.push({
        t: latestAccepting.t,
        // token type/name
        v: str.slice(cursor - tokenLength, cursor),
        // string value
        s: cursor - tokenLength,
        // start index
        e: cursor
        // end index (excluding)
      });
    }
    return tokens;
  }
  function stringToArray(str) {
    const result = [];
    const len = str.length;
    let index = 0;
    while (index < len) {
      let first2 = str.charCodeAt(index);
      let second;
      let char = first2 < 55296 || first2 > 56319 || index + 1 === len || (second = str.charCodeAt(index + 1)) < 56320 || second > 57343 ? str[index] : str.slice(index, index + 2);
      result.push(char);
      index += char.length;
    }
    return result;
  }
  function fastts(state, input, t, defaultt, jr) {
    let next;
    const len = input.length;
    for (let i = 0; i < len - 1; i++) {
      const char = input[i];
      if (state.j[char]) {
        next = state.j[char];
      } else {
        next = new State(defaultt);
        next.jr = jr.slice();
        state.j[char] = next;
      }
      state = next;
    }
    next = new State(t);
    next.jr = jr.slice();
    state.j[input[len - 1]] = next;
    return next;
  }
  function decodeTlds(encoded) {
    const words = [];
    const stack = [];
    let i = 0;
    let digits = "0123456789";
    while (i < encoded.length) {
      let popDigitCount = 0;
      while (digits.indexOf(encoded[i + popDigitCount]) >= 0) {
        popDigitCount++;
      }
      if (popDigitCount > 0) {
        words.push(stack.join(""));
        for (let popCount = parseInt(encoded.substring(i, i + popDigitCount), 10); popCount > 0; popCount--) {
          stack.pop();
        }
        i += popDigitCount;
      } else {
        stack.push(encoded[i]);
        i++;
      }
    }
    return words;
  }
  var defaults = {
    defaultProtocol: "http",
    events: null,
    format: noop,
    formatHref: noop,
    nl2br: false,
    tagName: "a",
    target: null,
    rel: null,
    validate: true,
    truncate: Infinity,
    className: null,
    attributes: null,
    ignoreTags: [],
    render: null
  };
  function Options(opts, defaultRender) {
    if (defaultRender === void 0) {
      defaultRender = null;
    }
    let o = assign({}, defaults);
    if (opts) {
      o = assign(o, opts instanceof Options ? opts.o : opts);
    }
    const ignoredTags = o.ignoreTags;
    const uppercaseIgnoredTags = [];
    for (let i = 0; i < ignoredTags.length; i++) {
      uppercaseIgnoredTags.push(ignoredTags[i].toUpperCase());
    }
    this.o = o;
    if (defaultRender) {
      this.defaultRender = defaultRender;
    }
    this.ignoreTags = uppercaseIgnoredTags;
  }
  Options.prototype = {
    o: defaults,
    /**
     * @type string[]
     */
    ignoreTags: [],
    /**
     * @param {IntermediateRepresentation} ir
     * @returns {any}
     */
    defaultRender(ir) {
      return ir;
    },
    /**
     * Returns true or false based on whether a token should be displayed as a
     * link based on the user options.
     * @param {MultiToken} token
     * @returns {boolean}
     */
    check(token) {
      return this.get("validate", token.toString(), token);
    },
    // Private methods
    /**
     * Resolve an option's value based on the value of the option and the given
     * params. If operator and token are specified and the target option is
     * callable, automatically calls the function with the given argument.
     * @template {keyof Opts} K
     * @param {K} key Name of option to use
     * @param {string} [operator] will be passed to the target option if it's a
     * function. If not specified, RAW function value gets returned
     * @param {MultiToken} [token] The token from linkify.tokenize
     * @returns {Opts[K] | any}
     */
    get(key, operator, token) {
      const isCallable = operator != null;
      let option = this.o[key];
      if (!option) {
        return option;
      }
      if (typeof option === "object") {
        option = token.t in option ? option[token.t] : defaults[key];
        if (typeof option === "function" && isCallable) {
          option = option(operator, token);
        }
      } else if (typeof option === "function" && isCallable) {
        option = option(operator, token.t, token);
      }
      return option;
    },
    /**
     * @template {keyof Opts} L
     * @param {L} key Name of options object to use
     * @param {string} [operator]
     * @param {MultiToken} [token]
     * @returns {Opts[L] | any}
     */
    getObj(key, operator, token) {
      let obj = this.o[key];
      if (typeof obj === "function" && operator != null) {
        obj = obj(operator, token.t, token);
      }
      return obj;
    },
    /**
     * Convert the given token to a rendered element that may be added to the
     * calling-interface's DOM
     * @param {MultiToken} token Token to render to an HTML element
     * @returns {any} Render result; e.g., HTML string, DOM element, React
     *   Component, etc.
     */
    render(token) {
      const ir = token.render(this);
      const renderFn = this.get("render", null, token) || this.defaultRender;
      return renderFn(ir, token.t, token);
    }
  };
  function noop(val) {
    return val;
  }
  function MultiToken(value, tokens) {
    this.t = "token";
    this.v = value;
    this.tk = tokens;
  }
  MultiToken.prototype = {
    isLink: false,
    /**
     * Return the string this token represents.
     * @return {string}
     */
    toString() {
      return this.v;
    },
    /**
     * What should the value for this token be in the `href` HTML attribute?
     * Returns the `.toString` value by default.
     * @param {string} [scheme]
     * @return {string}
    */
    toHref(scheme2) {
      return this.toString();
    },
    /**
     * @param {Options} options Formatting options
     * @returns {string}
     */
    toFormattedString(options) {
      const val = this.toString();
      const truncate = options.get("truncate", val, this);
      const formatted = options.get("format", val, this);
      return truncate && formatted.length > truncate ? formatted.substring(0, truncate) + "\u2026" : formatted;
    },
    /**
     *
     * @param {Options} options
     * @returns {string}
     */
    toFormattedHref(options) {
      return options.get("formatHref", this.toHref(options.get("defaultProtocol")), this);
    },
    /**
     * The start index of this token in the original input string
     * @returns {number}
     */
    startIndex() {
      return this.tk[0].s;
    },
    /**
     * The end index of this token in the original input string (up to this
     * index but not including it)
     * @returns {number}
     */
    endIndex() {
      return this.tk[this.tk.length - 1].e;
    },
    /**
    	Returns an object  of relevant values for this token, which includes keys
    	* type - Kind of token ('url', 'email', etc.)
    	* value - Original text
    	* href - The value that should be added to the anchor tag's href
    		attribute
    		@method toObject
    	@param {string} [protocol] `'http'` by default
    */
    toObject(protocol) {
      if (protocol === void 0) {
        protocol = defaults.defaultProtocol;
      }
      return {
        type: this.t,
        value: this.toString(),
        isLink: this.isLink,
        href: this.toHref(protocol),
        start: this.startIndex(),
        end: this.endIndex()
      };
    },
    /**
     *
     * @param {Options} options Formatting option
     */
    toFormattedObject(options) {
      return {
        type: this.t,
        value: this.toFormattedString(options),
        isLink: this.isLink,
        href: this.toFormattedHref(options),
        start: this.startIndex(),
        end: this.endIndex()
      };
    },
    /**
     * Whether this token should be rendered as a link according to the given options
     * @param {Options} options
     * @returns {boolean}
     */
    validate(options) {
      return options.get("validate", this.toString(), this);
    },
    /**
     * Return an object that represents how this link should be rendered.
     * @param {Options} options Formattinng options
     */
    render(options) {
      const token = this;
      const href = this.toHref(options.get("defaultProtocol"));
      const formattedHref = options.get("formatHref", href, this);
      const tagName = options.get("tagName", href, token);
      const content = this.toFormattedString(options);
      const attributes = {};
      const className = options.get("className", href, token);
      const target = options.get("target", href, token);
      const rel = options.get("rel", href, token);
      const attrs = options.getObj("attributes", href, token);
      const eventListeners = options.getObj("events", href, token);
      attributes.href = formattedHref;
      if (className) {
        attributes.class = className;
      }
      if (target) {
        attributes.target = target;
      }
      if (rel) {
        attributes.rel = rel;
      }
      if (attrs) {
        assign(attributes, attrs);
      }
      return {
        tagName,
        attributes,
        content,
        eventListeners
      };
    }
  };
  function createTokenClass(type, props) {
    class Token extends MultiToken {
      constructor(value, tokens) {
        super(value, tokens);
        this.t = type;
      }
    }
    for (const p in props) {
      Token.prototype[p] = props[p];
    }
    Token.t = type;
    return Token;
  }
  var Email = createTokenClass("email", {
    isLink: true,
    toHref() {
      return "mailto:" + this.toString();
    }
  });
  var Text = createTokenClass("text");
  var Nl = createTokenClass("nl");
  var Url = createTokenClass("url", {
    isLink: true,
    /**
    	Lowercases relevant parts of the domain and adds the protocol if
    	required. Note that this will not escape unsafe HTML characters in the
    	URL.
    		@param {string} [scheme] default scheme (e.g., 'https')
    	@return {string} the full href
    */
    toHref(scheme2) {
      if (scheme2 === void 0) {
        scheme2 = defaults.defaultProtocol;
      }
      return this.hasProtocol() ? this.v : `${scheme2}://${this.v}`;
    },
    /**
     * Check whether this URL token has a protocol
     * @return {boolean}
     */
    hasProtocol() {
      const tokens = this.tk;
      return tokens.length >= 2 && tokens[0].t !== LOCALHOST && tokens[1].t === COLON;
    }
  });
  var makeState = (arg) => new State(arg);
  function init$1(_ref) {
    let {
      groups
    } = _ref;
    const qsAccepting = groups.domain.concat([AMPERSAND, ASTERISK, AT, BACKSLASH, BACKTICK, CARET, DOLLAR, EQUALS, HYPHEN, NUM, PERCENT, PIPE, PLUS, POUND, SLASH, SYM, TILDE, UNDERSCORE]);
    const qsNonAccepting = [APOSTROPHE, CLOSEANGLEBRACKET, CLOSEBRACE, CLOSEBRACKET, CLOSEPAREN, COLON, COMMA, DOT, EXCLAMATION, OPENANGLEBRACKET, OPENBRACE, OPENBRACKET, OPENPAREN, QUERY, QUOTE, SEMI];
    const localpartAccepting = [AMPERSAND, APOSTROPHE, ASTERISK, BACKSLASH, BACKTICK, CARET, CLOSEBRACE, DOLLAR, EQUALS, HYPHEN, OPENBRACE, PERCENT, PIPE, PLUS, POUND, QUERY, SLASH, SYM, TILDE, UNDERSCORE];
    const Start = makeState();
    const Localpart = tt(Start, TILDE);
    ta(Localpart, localpartAccepting, Localpart);
    ta(Localpart, groups.domain, Localpart);
    const Domain = makeState(), Scheme = makeState(), SlashScheme = makeState();
    ta(Start, groups.domain, Domain);
    ta(Start, groups.scheme, Scheme);
    ta(Start, groups.slashscheme, SlashScheme);
    ta(Domain, localpartAccepting, Localpart);
    ta(Domain, groups.domain, Domain);
    const LocalpartAt = tt(Domain, AT);
    tt(Localpart, AT, LocalpartAt);
    tt(Scheme, AT, LocalpartAt);
    tt(SlashScheme, AT, LocalpartAt);
    const LocalpartDot = tt(Localpart, DOT);
    ta(LocalpartDot, localpartAccepting, Localpart);
    ta(LocalpartDot, groups.domain, Localpart);
    const EmailDomain = makeState();
    ta(LocalpartAt, groups.domain, EmailDomain);
    ta(EmailDomain, groups.domain, EmailDomain);
    const EmailDomainDot = tt(EmailDomain, DOT);
    ta(EmailDomainDot, groups.domain, EmailDomain);
    const Email$1 = makeState(Email);
    ta(EmailDomainDot, groups.tld, Email$1);
    ta(EmailDomainDot, groups.utld, Email$1);
    tt(LocalpartAt, LOCALHOST, Email$1);
    const EmailDomainHyphen = tt(EmailDomain, HYPHEN);
    ta(EmailDomainHyphen, groups.domain, EmailDomain);
    ta(Email$1, groups.domain, EmailDomain);
    tt(Email$1, DOT, EmailDomainDot);
    tt(Email$1, HYPHEN, EmailDomainHyphen);
    const EmailColon = tt(Email$1, COLON);
    ta(EmailColon, groups.numeric, Email);
    const DomainHyphen = tt(Domain, HYPHEN);
    const DomainDot = tt(Domain, DOT);
    ta(DomainHyphen, groups.domain, Domain);
    ta(DomainDot, localpartAccepting, Localpart);
    ta(DomainDot, groups.domain, Domain);
    const DomainDotTld = makeState(Url);
    ta(DomainDot, groups.tld, DomainDotTld);
    ta(DomainDot, groups.utld, DomainDotTld);
    ta(DomainDotTld, groups.domain, Domain);
    ta(DomainDotTld, localpartAccepting, Localpart);
    tt(DomainDotTld, DOT, DomainDot);
    tt(DomainDotTld, HYPHEN, DomainHyphen);
    tt(DomainDotTld, AT, LocalpartAt);
    const DomainDotTldColon = tt(DomainDotTld, COLON);
    const DomainDotTldColonPort = makeState(Url);
    ta(DomainDotTldColon, groups.numeric, DomainDotTldColonPort);
    const Url$1 = makeState(Url);
    const UrlNonaccept = makeState();
    ta(Url$1, qsAccepting, Url$1);
    ta(Url$1, qsNonAccepting, UrlNonaccept);
    ta(UrlNonaccept, qsAccepting, Url$1);
    ta(UrlNonaccept, qsNonAccepting, UrlNonaccept);
    tt(DomainDotTld, SLASH, Url$1);
    tt(DomainDotTldColonPort, SLASH, Url$1);
    const SchemeColon = tt(Scheme, COLON);
    const SlashSchemeColon = tt(SlashScheme, COLON);
    const SlashSchemeColonSlash = tt(SlashSchemeColon, SLASH);
    const UriPrefix = tt(SlashSchemeColonSlash, SLASH);
    ta(Scheme, groups.domain, Domain);
    tt(Scheme, DOT, DomainDot);
    tt(Scheme, HYPHEN, DomainHyphen);
    ta(SlashScheme, groups.domain, Domain);
    tt(SlashScheme, DOT, DomainDot);
    tt(SlashScheme, HYPHEN, DomainHyphen);
    ta(SchemeColon, groups.domain, Url$1);
    tt(SchemeColon, SLASH, Url$1);
    ta(UriPrefix, groups.domain, Url$1);
    ta(UriPrefix, qsAccepting, Url$1);
    tt(UriPrefix, SLASH, Url$1);
    const UrlOpenbrace = tt(Url$1, OPENBRACE);
    const UrlOpenbracket = tt(Url$1, OPENBRACKET);
    const UrlOpenanglebracket = tt(Url$1, OPENANGLEBRACKET);
    const UrlOpenparen = tt(Url$1, OPENPAREN);
    tt(UrlNonaccept, OPENBRACE, UrlOpenbrace);
    tt(UrlNonaccept, OPENBRACKET, UrlOpenbracket);
    tt(UrlNonaccept, OPENANGLEBRACKET, UrlOpenanglebracket);
    tt(UrlNonaccept, OPENPAREN, UrlOpenparen);
    tt(UrlOpenbrace, CLOSEBRACE, Url$1);
    tt(UrlOpenbracket, CLOSEBRACKET, Url$1);
    tt(UrlOpenanglebracket, CLOSEANGLEBRACKET, Url$1);
    tt(UrlOpenparen, CLOSEPAREN, Url$1);
    tt(UrlOpenbrace, CLOSEBRACE, Url$1);
    const UrlOpenbraceQ = makeState(Url);
    const UrlOpenbracketQ = makeState(Url);
    const UrlOpenanglebracketQ = makeState(Url);
    const UrlOpenparenQ = makeState(Url);
    ta(UrlOpenbrace, qsAccepting, UrlOpenbraceQ);
    ta(UrlOpenbracket, qsAccepting, UrlOpenbracketQ);
    ta(UrlOpenanglebracket, qsAccepting, UrlOpenanglebracketQ);
    ta(UrlOpenparen, qsAccepting, UrlOpenparenQ);
    const UrlOpenbraceSyms = makeState();
    const UrlOpenbracketSyms = makeState();
    const UrlOpenanglebracketSyms = makeState();
    const UrlOpenparenSyms = makeState();
    ta(UrlOpenbrace, qsNonAccepting);
    ta(UrlOpenbracket, qsNonAccepting);
    ta(UrlOpenanglebracket, qsNonAccepting);
    ta(UrlOpenparen, qsNonAccepting);
    ta(UrlOpenbraceQ, qsAccepting, UrlOpenbraceQ);
    ta(UrlOpenbracketQ, qsAccepting, UrlOpenbracketQ);
    ta(UrlOpenanglebracketQ, qsAccepting, UrlOpenanglebracketQ);
    ta(UrlOpenparenQ, qsAccepting, UrlOpenparenQ);
    ta(UrlOpenbraceQ, qsNonAccepting, UrlOpenbraceQ);
    ta(UrlOpenbracketQ, qsNonAccepting, UrlOpenbracketQ);
    ta(UrlOpenanglebracketQ, qsNonAccepting, UrlOpenanglebracketQ);
    ta(UrlOpenparenQ, qsNonAccepting, UrlOpenparenQ);
    ta(UrlOpenbraceSyms, qsAccepting, UrlOpenbraceSyms);
    ta(UrlOpenbracketSyms, qsAccepting, UrlOpenbracketQ);
    ta(UrlOpenanglebracketSyms, qsAccepting, UrlOpenanglebracketQ);
    ta(UrlOpenparenSyms, qsAccepting, UrlOpenparenQ);
    ta(UrlOpenbraceSyms, qsNonAccepting, UrlOpenbraceSyms);
    ta(UrlOpenbracketSyms, qsNonAccepting, UrlOpenbracketSyms);
    ta(UrlOpenanglebracketSyms, qsNonAccepting, UrlOpenanglebracketSyms);
    ta(UrlOpenparenSyms, qsNonAccepting, UrlOpenparenSyms);
    tt(UrlOpenbracketQ, CLOSEBRACKET, Url$1);
    tt(UrlOpenanglebracketQ, CLOSEANGLEBRACKET, Url$1);
    tt(UrlOpenparenQ, CLOSEPAREN, Url$1);
    tt(UrlOpenbraceQ, CLOSEBRACE, Url$1);
    tt(UrlOpenbracketSyms, CLOSEBRACKET, Url$1);
    tt(UrlOpenanglebracketSyms, CLOSEANGLEBRACKET, Url$1);
    tt(UrlOpenparenSyms, CLOSEPAREN, Url$1);
    tt(UrlOpenbraceSyms, CLOSEPAREN, Url$1);
    tt(Start, LOCALHOST, DomainDotTld);
    tt(Start, NL$1, Nl);
    return {
      start: Start,
      tokens: tk
    };
  }
  function run(start, input, tokens) {
    let len = tokens.length;
    let cursor = 0;
    let multis = [];
    let textTokens = [];
    while (cursor < len) {
      let state = start;
      let secondState = null;
      let nextState = null;
      let multiLength = 0;
      let latestAccepting = null;
      let sinceAccepts = -1;
      while (cursor < len && !(secondState = state.go(tokens[cursor].t))) {
        textTokens.push(tokens[cursor++]);
      }
      while (cursor < len && (nextState = secondState || state.go(tokens[cursor].t))) {
        secondState = null;
        state = nextState;
        if (state.accepts()) {
          sinceAccepts = 0;
          latestAccepting = state;
        } else if (sinceAccepts >= 0) {
          sinceAccepts++;
        }
        cursor++;
        multiLength++;
      }
      if (sinceAccepts < 0) {
        cursor -= multiLength;
        if (cursor < len) {
          textTokens.push(tokens[cursor]);
          cursor++;
        }
      } else {
        if (textTokens.length > 0) {
          multis.push(initMultiToken(Text, input, textTokens));
          textTokens = [];
        }
        cursor -= sinceAccepts;
        multiLength -= sinceAccepts;
        const Multi = latestAccepting.t;
        const subtokens = tokens.slice(cursor - multiLength, cursor);
        multis.push(initMultiToken(Multi, input, subtokens));
      }
    }
    if (textTokens.length > 0) {
      multis.push(initMultiToken(Text, input, textTokens));
    }
    return multis;
  }
  function initMultiToken(Multi, input, tokens) {
    const startIdx = tokens[0].s;
    const endIdx = tokens[tokens.length - 1].e;
    const value = input.slice(startIdx, endIdx);
    return new Multi(value, tokens);
  }
  var warn = typeof console !== "undefined" && console && console.warn || (() => {
  });
  var warnAdvice = "until manual call of linkify.init(). Register all schemes and plugins before invoking linkify the first time.";
  var INIT = {
    scanner: null,
    parser: null,
    tokenQueue: [],
    pluginQueue: [],
    customSchemes: [],
    initialized: false
  };
  function reset() {
    State.groups = {};
    INIT.scanner = null;
    INIT.parser = null;
    INIT.tokenQueue = [];
    INIT.pluginQueue = [];
    INIT.customSchemes = [];
    INIT.initialized = false;
  }
  function registerCustomProtocol(scheme2, optionalSlashSlash) {
    if (optionalSlashSlash === void 0) {
      optionalSlashSlash = false;
    }
    if (INIT.initialized) {
      warn(`linkifyjs: already initialized - will not register custom scheme "${scheme2}" ${warnAdvice}`);
    }
    if (!/^[0-9a-z]+(-[0-9a-z]+)*$/.test(scheme2)) {
      throw new Error('linkifyjs: incorrect scheme format.\n 1. Must only contain digits, lowercase ASCII letters or "-"\n 2. Cannot start or end with "-"\n 3. "-" cannot repeat');
    }
    INIT.customSchemes.push([scheme2, optionalSlashSlash]);
  }
  function init() {
    INIT.scanner = init$2(INIT.customSchemes);
    for (let i = 0; i < INIT.tokenQueue.length; i++) {
      INIT.tokenQueue[i][1]({
        scanner: INIT.scanner
      });
    }
    INIT.parser = init$1(INIT.scanner.tokens);
    for (let i = 0; i < INIT.pluginQueue.length; i++) {
      INIT.pluginQueue[i][1]({
        scanner: INIT.scanner,
        parser: INIT.parser
      });
    }
    INIT.initialized = true;
  }
  function tokenize(str) {
    if (!INIT.initialized) {
      init();
    }
    return run(INIT.parser.start, str, run$1(INIT.scanner.start, str));
  }
  function find(str, type, opts) {
    if (type === void 0) {
      type = null;
    }
    if (opts === void 0) {
      opts = null;
    }
    if (type && typeof type === "object") {
      if (opts) {
        throw Error(`linkifyjs: Invalid link type ${type}; must be a string`);
      }
      opts = type;
      type = null;
    }
    const options = new Options(opts);
    const tokens = tokenize(str);
    const filtered = [];
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.isLink && (!type || token.t === type)) {
        filtered.push(token.toFormattedObject(options));
      }
    }
    return filtered;
  }

  // node_modules/@tiptap/extension-link/dist/index.js
  function autolink(options) {
    return new Plugin({
      key: new PluginKey("autolink"),
      appendTransaction: (transactions, oldState, newState) => {
        const docChanges = transactions.some((transaction) => transaction.docChanged) && !oldState.doc.eq(newState.doc);
        const preventAutolink = transactions.some((transaction) => transaction.getMeta("preventAutolink"));
        if (!docChanges || preventAutolink) {
          return;
        }
        const { tr: tr2 } = newState;
        const transform = combineTransactionSteps(oldState.doc, [...transactions]);
        const changes = getChangedRanges(transform);
        changes.forEach(({ newRange }) => {
          const nodesInChangedRanges = findChildrenInRange(newState.doc, newRange, (node) => node.isTextblock);
          let textBlock;
          let textBeforeWhitespace;
          if (nodesInChangedRanges.length > 1) {
            textBlock = nodesInChangedRanges[0];
            textBeforeWhitespace = newState.doc.textBetween(textBlock.pos, textBlock.pos + textBlock.node.nodeSize, void 0, " ");
          } else if (nodesInChangedRanges.length && newState.doc.textBetween(newRange.from, newRange.to, " ", " ").endsWith(" ")) {
            textBlock = nodesInChangedRanges[0];
            textBeforeWhitespace = newState.doc.textBetween(textBlock.pos, newRange.to, void 0, " ");
          }
          if (textBlock && textBeforeWhitespace) {
            const wordsBeforeWhitespace = textBeforeWhitespace.split(" ").filter((s) => s !== "");
            if (wordsBeforeWhitespace.length <= 0) {
              return false;
            }
            const lastWordBeforeSpace = wordsBeforeWhitespace[wordsBeforeWhitespace.length - 1];
            const lastWordAndBlockOffset = textBlock.pos + textBeforeWhitespace.lastIndexOf(lastWordBeforeSpace);
            if (!lastWordBeforeSpace) {
              return false;
            }
            find(lastWordBeforeSpace).filter((link) => link.isLink).map((link) => ({
              ...link,
              from: lastWordAndBlockOffset + link.start + 1,
              to: lastWordAndBlockOffset + link.end + 1
            })).filter((link) => {
              if (!newState.schema.marks.code) {
                return true;
              }
              return !newState.doc.rangeHasMark(link.from, link.to, newState.schema.marks.code);
            }).filter((link) => {
              if (options.validate) {
                return options.validate(link.value);
              }
              return true;
            }).forEach((link) => {
              if (getMarksBetween(link.from, link.to, newState.doc).some((item) => item.mark.type === options.type)) {
                return;
              }
              tr2.addMark(link.from, link.to, options.type.create({
                href: link.href
              }));
            });
          }
        });
        if (!tr2.steps.length) {
          return;
        }
        return tr2;
      }
    });
  }
  function clickHandler(options) {
    return new Plugin({
      key: new PluginKey("handleClickLink"),
      props: {
        handleClick: (view, pos, event) => {
          var _a, _b;
          if (event.button !== 0) {
            return false;
          }
          const eventTarget = event.target;
          if (eventTarget.nodeName !== "A") {
            return false;
          }
          const attrs = getAttributes(view.state, options.type.name);
          const link = event.target;
          const href = (_a = link === null || link === void 0 ? void 0 : link.href) !== null && _a !== void 0 ? _a : attrs.href;
          const target = (_b = link === null || link === void 0 ? void 0 : link.target) !== null && _b !== void 0 ? _b : attrs.target;
          if (link && href) {
            if (view.editable) {
              window.open(href, target);
            }
            return true;
          }
          return false;
        }
      }
    });
  }
  function pasteHandler(options) {
    return new Plugin({
      key: new PluginKey("handlePasteLink"),
      props: {
        handlePaste: (view, event, slice) => {
          var _a, _b;
          const { state } = view;
          const { selection } = state;
          if (state.doc.resolve(selection.from).parent.type.spec.code) {
            return false;
          }
          let textContent = "";
          slice.content.forEach((node) => {
            textContent += node.textContent;
          });
          let isAlreadyLink = false;
          slice.content.descendants((node) => {
            if (node.marks.some((mark) => mark.type.name === options.type.name)) {
              isAlreadyLink = true;
            }
          });
          if (isAlreadyLink) {
            return;
          }
          const link = find(textContent).find((item) => item.isLink && item.value === textContent);
          if (!selection.empty && options.linkOnPaste) {
            const pastedLink = (link === null || link === void 0 ? void 0 : link.href) || null;
            if (pastedLink) {
              options.editor.commands.setMark(options.type, { href: pastedLink });
              return true;
            }
          }
          const firstChildIsText = ((_a = slice.content.firstChild) === null || _a === void 0 ? void 0 : _a.type.name) === "text";
          const firstChildContainsLinkMark = (_b = slice.content.firstChild) === null || _b === void 0 ? void 0 : _b.marks.some((mark) => mark.type.name === options.type.name);
          if (firstChildIsText && firstChildContainsLinkMark || !options.linkOnPaste) {
            return false;
          }
          if (link && selection.empty) {
            options.editor.commands.insertContent(`<a href="${link.href}">${link.href}</a>`);
            return true;
          }
          const { tr: tr2 } = state;
          let deleteOnly = false;
          if (!selection.empty) {
            deleteOnly = true;
            tr2.delete(selection.from, selection.to);
          }
          let currentPos = selection.from;
          let fragmentLinks = [];
          slice.content.forEach((node) => {
            fragmentLinks = find(node.textContent);
            tr2.insert(currentPos - 1, node);
            if (fragmentLinks.length > 0) {
              deleteOnly = false;
              fragmentLinks.forEach((fragmentLink) => {
                const linkStart = currentPos + fragmentLink.start;
                const linkEnd = currentPos + fragmentLink.end;
                const hasMark = tr2.doc.rangeHasMark(linkStart, linkEnd, options.type);
                if (!hasMark) {
                  tr2.addMark(linkStart, linkEnd, options.type.create({ href: fragmentLink.href }));
                }
              });
            }
            currentPos += node.nodeSize;
          });
          const hasFragmentLinks = fragmentLinks.length > 0;
          if (tr2.docChanged && !deleteOnly && hasFragmentLinks) {
            options.editor.view.dispatch(tr2);
            return true;
          }
          return false;
        }
      }
    });
  }
  var Link = Mark2.create({
    name: "link",
    priority: 1e3,
    keepOnSplit: false,
    onCreate() {
      this.options.protocols.forEach((protocol) => {
        if (typeof protocol === "string") {
          registerCustomProtocol(protocol);
          return;
        }
        registerCustomProtocol(protocol.scheme, protocol.optionalSlashes);
      });
    },
    onDestroy() {
      reset();
    },
    inclusive() {
      return this.options.autolink;
    },
    addOptions() {
      return {
        openOnClick: true,
        linkOnPaste: true,
        autolink: true,
        protocols: [],
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer nofollow",
          class: null
        },
        validate: void 0
      };
    },
    addAttributes() {
      return {
        href: {
          default: null
        },
        target: {
          default: this.options.HTMLAttributes.target
        },
        rel: {
          default: this.options.HTMLAttributes.rel
        },
        class: {
          default: this.options.HTMLAttributes.class
        }
      };
    },
    parseHTML() {
      return [{ tag: 'a[href]:not([href *= "javascript:" i])' }];
    },
    renderHTML({ HTMLAttributes }) {
      return ["a", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
    },
    addCommands() {
      return {
        setLink: (attributes) => ({ chain }) => {
          return chain().setMark(this.name, attributes).setMeta("preventAutolink", true).run();
        },
        toggleLink: (attributes) => ({ chain }) => {
          return chain().toggleMark(this.name, attributes, { extendEmptyMarkRange: true }).setMeta("preventAutolink", true).run();
        },
        unsetLink: () => ({ chain }) => {
          return chain().unsetMark(this.name, { extendEmptyMarkRange: true }).setMeta("preventAutolink", true).run();
        }
      };
    },
    addProseMirrorPlugins() {
      const plugins = [];
      if (this.options.autolink) {
        plugins.push(autolink({
          type: this.type,
          validate: this.options.validate
        }));
      }
      if (this.options.openOnClick) {
        plugins.push(clickHandler({
          type: this.type
        }));
      }
      plugins.push(pasteHandler({
        editor: this.editor,
        type: this.type,
        linkOnPaste: this.options.linkOnPaste
      }));
      return plugins;
    }
  });

  // packages/link/resources/js/index.js
  registerExtension("link", () => [
    Link.extend({
      addKeyboardShortcuts() {
        return {
          "Mod-k": ({
            editor: {
              state: {
                selection: { from, to }
              }
            }
          }) => {
            if (from !== to) {
              return true;
            }
            return false;
          }
        };
      }
    }).configure({
      HTMLAttributes: { target: "_blank", rel: "noopener" },
      openOnClick: false,
      linkOnPaste: true,
      autolink: true
    })
  ]);
})();