import Ember from 'ember';

var IMG_ATTRIBUTES = [
  'id', 'title', 'align', 'alt', 'border', 'height',
  'hspace', 'ismap', 'longdesc', 'name', 'width',
  'usemap', 'vspace'
];

/**
 * @class ImgWrapComponent
 * @extends Ember.Component
 *
 * @property {ImgManagerService} manager
 */
var ImgWrapComponent = Ember.Component.extend({
  /**
   * @inheritDoc
   */
  attributeBindings: ['style'],

  /**
   * @inheritDoc
   */
  tagName: 'span',

  /**
   * @inheritDoc
   */
  classNames: ['img-wrap'],

  /**
   * @inheritDoc
   */
  classNameBindings: ['statusClass'],

  /**
   * The css styles of our span
   * @property style
   * @type {string}
   */
  style: 'display: inline-block;',


  /**
   * The src attribute of the image
   * @property src
   * @type {string}
   */
  src: null,

  /**
   * Our image source
   * @property imgSource
   * @type {ImgSource}
   */
  imgSource: Ember.computed('src', function () {
    var opt = this.getProperties('manager', 'src');
    return opt.src ? opt.manager.imgSourceForSrc(opt.src) : null;
  }).readOnly(),

  /**
   * Loading class
   * @property loadingClass
   * @type {string}
   */
  loadingClass: Ember.computed.oneWay('manager.defaultLoadingClass'),

  /**
   * Error class
   * @property errorClass
   * @type {string}
   */
  errorClass: Ember.computed.oneWay('manager.defaultErrorClass'),

  /**
   * Success class
   * @property successClass
   * @type {string}
   */
  successClass: Ember.computed.oneWay('manager.defaultSuccessClass'),

  /**
   * The css class related to the current status
   * @property statusClass
   * @type {string}
   */
  statusClass: Ember.computed(
    'imgSource.isLoading', 'imgSource.isError', 'imgSource.isSuccess',
    'loadingClass', 'errorClass', 'successClass',
    function () {
      var opt = this.get('imgSource').getProperties('isLoading', 'isError', 'isSuccess');
      if (opt.isLoading) {
        return this.get('loadingClass');
      }
      else if (opt.isError) {
        return this.get('errorClass');
      }
      else if (opt.isSuccess) {
        return this.get('successClass');
      }
    }).readOnly(),


  /**
   * Insert our clone in the DOM
   *
   * @method _insertClone
   * @private
   */
  _insertClone: Ember.observer('src', function () {
    var clone;
    if (this._state === 'inDOM' && (clone = this._createClone())) {
      // the _createClone will also release the old one if any
      this.get('element').appendChild(clone);
    }
  }).on('didInsertElement'),

  /**
   * Sends the correct event related to the current status
   *
   * @method _sendStatusAction
   * @private
   */
  _sendStatusAction: Ember.observer('imgSource.isError', 'imgSource.isSuccess', function () {
    if (this.get('imgSource.isError')) {
      this.sendAction('error');
    }
    else if (this.get('imgSource.isSuccess')) {
      this.sendAction('success');
    }
  }),

  /**
   * Release the clone used if any
   *
   * @method _releaseClone
   * @private
   */
  _releaseClone: Ember.on('willDestroyElement', function () {
    var meta = this._currentClone;
    if (meta) {
      meta.imgSource.releaseClone(meta.clone);
      this._currentClone = null;
    }
  }),

  /**
   * Create a clone after releasing the possible existing one
   *
   * @method _createClone
   * @private
   */
  _createClone: function () {
    var clone, imgSource = this.get('imgSource');
    this._releaseClone();
    if (imgSource) {
      clone = imgSource.createClone(this.getProperties(IMG_ATTRIBUTES));
      this._currentClone = {
        imgSource: imgSource,
        clone:     clone
      };
    }
    return clone;
  }

});

// now create the setters for each image attribute so that we can update them on each clone
var extra = {};
Ember.EnumerableUtils.forEach(IMG_ATTRIBUTES, function (name) {
  extra[name] = Ember.computed(function (key, value) {
    if (arguments.length > 1) {
      if (this._currentClone) {
        this.get('manager').setCloneAttribute(this._currentClone.clone, name, value);
      }
      return value;
    }
  });
});
ImgWrapComponent.reopen(extra);

export default ImgWrapComponent;