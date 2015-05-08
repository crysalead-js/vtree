var query = require("dom-query");
var tree = require("./tree");
var isArray = Array.isArray;

function Layer() {
  this._mountedIndex = 0;
  this._mounted = Object.create(null);
}

/**
 * Mounts a virtual tree into a passed selector.
 *
 * @param String|Object   selector A CSS string selector or a DOMElement identifying the mounting point(s).
 * @param Function|Object factory  A factory function which returns a virtual tree or the virtual tree itself.
 * @param Object          data     Some extra data to attach to the mount.
 */
Layer.prototype.mount = function(selector, factory, data) {
  data = data || {};
  this.unmount(selector);
  var containers = query.all(selector);
  if (!containers.length) {
    return;
  }
  if (containers.length > 1) {
    return containers.map(function(container) {
      return this.mount(container, mount);
    });
  }
  var container = containers[0];
  this._mountedIndex++;
  var mountId = "" + this._mountedIndex;

  data.container = container;
  data.factory = factory;
  data.inSvg = container.tagName === "svg";
  data.children = tree.create(container, factory, null);
  this._mounted[mountId] = data;
  return container.domLayerId = mountId;
}

/**
 * Unmounts a virtual tree.
 *
 * @param String|Object selector A CSS string selector or a DOMElement identifying the mounting point(s).
 */
Layer.prototype.unmount = function(selector) {
  var containers = query.all(selector);
  if (!containers.length) {
    return;
  }
  if (containers.length > 1) {
    for(var i = 0, len = containers.length; i < len; i++) {
      this.unmount(containers[i]);
    }
    return;
  }
  var container = containers[0];
  var mountId = container.domLayerId;
  if (!mountId) {
    return;
  }
  tree.remove(this._mounted[mountId].children);
  delete this._mounted[mountId];
  delete container.domLayerId;
}

/**
 * Updates a mount (ie. run the factory function and updates the DOM according to occured changes).
 *
 * @param String mountId An optionnal mount identifier or none to update all mounted virtual trees.
 */
Layer.prototype.update = function(mountId) {
  if (arguments.length) {
    var mount = this._mounted[mountId];
    if (mount) {
      mount.children = tree.update(mount.container, mount.children, mount.factory, null, mount.inSvg);
    }
    return;
  }
  for (mountId in self._mounted) {
    this.update(mountId);
  }
}

/**
 * Returns the definition of a mounted tree all of them if no `mountId` is provided.
 *
 * @param  String mountId A mount identifier or none to get all mounts.
 * @return Object         A mount definition or all of them indexed by their id.
 */
Layer.prototype.mounted = function(mountId) {
  if (arguments.length) {
    return this._mounted[mountId];
  }
  return this._mounted;
}

module.exports = Layer;
