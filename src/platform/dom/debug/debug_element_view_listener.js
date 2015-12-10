'use strict';var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var lang_1 = require('angular2/src/facade/lang');
var collection_1 = require('angular2/src/facade/collection');
var di_1 = require('angular2/src/core/di');
var view_listener_1 = require('angular2/src/core/linker/view_listener');
var dom_adapter_1 = require('angular2/src/platform/dom/dom_adapter');
var api_1 = require('angular2/src/core/render/api');
var debug_element_1 = require('angular2/src/core/debug/debug_element');
var NG_ID_PROPERTY = 'ngid';
var INSPECT_GLOBAL_NAME = 'ng.probe';
var NG_ID_SEPARATOR = '#';
// Need to keep the views in a global Map so that multiple angular apps are supported
var _allIdsByView = new collection_1.Map();
var _allViewsById = new collection_1.Map();
var _nextId = 0;
function _setElementId(element, indices) {
    if (lang_1.isPresent(element) && dom_adapter_1.DOM.isElementNode(element)) {
        dom_adapter_1.DOM.setData(element, NG_ID_PROPERTY, indices.join(NG_ID_SEPARATOR));
    }
}
function _getElementId(element) {
    var elId = dom_adapter_1.DOM.getData(element, NG_ID_PROPERTY);
    if (lang_1.isPresent(elId)) {
        return elId.split(NG_ID_SEPARATOR).map(function (partStr) { return lang_1.NumberWrapper.parseInt(partStr, 10); });
    }
    else {
        return null;
    }
}
function inspectNativeElement(element) {
    var elId = _getElementId(element);
    if (lang_1.isPresent(elId)) {
        var view = _allViewsById.get(elId[0]);
        if (lang_1.isPresent(view)) {
            return new debug_element_1.DebugElement_(view, elId[1]);
        }
    }
    return null;
}
exports.inspectNativeElement = inspectNativeElement;
var DebugElementViewListener = (function () {
    function DebugElementViewListener(_renderer) {
        this._renderer = _renderer;
        dom_adapter_1.DOM.setGlobalVar(INSPECT_GLOBAL_NAME, inspectNativeElement);
    }
    DebugElementViewListener.prototype.onViewCreated = function (view) {
        var viewId = _nextId++;
        _allViewsById.set(viewId, view);
        _allIdsByView.set(view, viewId);
        for (var i = 0; i < view.elementRefs.length; i++) {
            var el = view.elementRefs[i];
            _setElementId(this._renderer.getNativeElementSync(el), [viewId, i]);
        }
    };
    DebugElementViewListener.prototype.onViewDestroyed = function (view) {
        var viewId = _allIdsByView.get(view);
        _allIdsByView.delete(view);
        _allViewsById.delete(viewId);
    };
    DebugElementViewListener = __decorate([
        di_1.Injectable(), 
        __metadata('design:paramtypes', [api_1.Renderer])
    ], DebugElementViewListener);
    return DebugElementViewListener;
})();
exports.DebugElementViewListener = DebugElementViewListener;
exports.ELEMENT_PROBE_PROVIDERS = lang_1.CONST_EXPR([
    DebugElementViewListener,
    lang_1.CONST_EXPR(new di_1.Provider(view_listener_1.AppViewListener, { useExisting: DebugElementViewListener })),
]);
exports.ELEMENT_PROBE_BINDINGS = exports.ELEMENT_PROBE_PROVIDERS;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdfZWxlbWVudF92aWV3X2xpc3RlbmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYW5ndWxhcjIvc3JjL3BsYXRmb3JtL2RvbS9kZWJ1Zy9kZWJ1Z19lbGVtZW50X3ZpZXdfbGlzdGVuZXIudHMiXSwibmFtZXMiOlsiX3NldEVsZW1lbnRJZCIsIl9nZXRFbGVtZW50SWQiLCJpbnNwZWN0TmF0aXZlRWxlbWVudCIsIkRlYnVnRWxlbWVudFZpZXdMaXN0ZW5lciIsIkRlYnVnRWxlbWVudFZpZXdMaXN0ZW5lci5jb25zdHJ1Y3RvciIsIkRlYnVnRWxlbWVudFZpZXdMaXN0ZW5lci5vblZpZXdDcmVhdGVkIiwiRGVidWdFbGVtZW50Vmlld0xpc3RlbmVyLm9uVmlld0Rlc3Ryb3llZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEscUJBQWtFLDBCQUEwQixDQUFDLENBQUE7QUFDN0YsMkJBQTJDLGdDQUFnQyxDQUFDLENBQUE7QUFDNUUsbUJBQTRDLHNCQUFzQixDQUFDLENBQUE7QUFDbkUsOEJBQThCLHdDQUF3QyxDQUFDLENBQUE7QUFFdkUsNEJBQWtCLHVDQUF1QyxDQUFDLENBQUE7QUFDMUQsb0JBQXVCLDhCQUE4QixDQUFDLENBQUE7QUFDdEQsOEJBQTBDLHVDQUF1QyxDQUFDLENBQUE7QUFFbEYsSUFBTSxjQUFjLEdBQUcsTUFBTSxDQUFDO0FBQzlCLElBQU0sbUJBQW1CLEdBQUcsVUFBVSxDQUFDO0FBRXZDLElBQU0sZUFBZSxHQUFHLEdBQUcsQ0FBQztBQUU1QixxRkFBcUY7QUFDckYsSUFBSSxhQUFhLEdBQUcsSUFBSSxnQkFBRyxFQUFtQixDQUFDO0FBQy9DLElBQUksYUFBYSxHQUFHLElBQUksZ0JBQUcsRUFBbUIsQ0FBQztBQUUvQyxJQUFJLE9BQU8sR0FBRyxDQUFDLENBQUM7QUFFaEIsdUJBQXVCLE9BQU8sRUFBRSxPQUFpQjtJQUMvQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsZ0JBQVNBLENBQUNBLE9BQU9BLENBQUNBLElBQUlB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QSxNQUFNQSxHQUFHQSxhQUFhQSxDQUFDQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNyQ0EsYUFBYUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDM0JBLGFBQWFBLENBQUNBLE1BQU1BLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO0lBQy9CQSxDQUFDQTtJQXBCSEg7UUFBQ0EsZUFBVUEsRUFBRUE7O2lDQXFCWkE7SUFBREEsK0JBQUNBO0FBQURBLENBQUNBLEFBckJELElBcUJDO0FBcEJZLGdDQUF3QiwyQkFvQnBDLENBQUE7QUFFWSwrQkFBdUIsR0FBVSxpQkFBVSxDQUFDO0lBQ3ZELHdCQUF3QjtJQUN4QixpQkFBVSxDQUFDLElBQUksYUFBUSxDQUFDLCtCQUFlLEVBQUUsRUFBQyxXQUFXLEVBQUUsd0JBQXdCLEVBQUMsQ0FBQyxDQUFDO0NBQ25GLENBQUMsQ0FBQztBQUVVLDhCQUFzQixHQUFHLCtCQUF1QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtDT05TVF9FWFBSLCBpc1ByZXNlbnQsIE51bWJlcldyYXBwZXIsIFN0cmluZ1dyYXBwZXJ9IGZyb20gJ2FuZ3VsYXIyL3NyYy9mYWNhZGUvbGFuZyc7XG5pbXBvcnQge01hcFdyYXBwZXIsIE1hcCwgTGlzdFdyYXBwZXJ9IGZyb20gJ2FuZ3VsYXIyL3NyYy9mYWNhZGUvY29sbGVjdGlvbic7XG5pbXBvcnQge0luamVjdGFibGUsIHByb3ZpZGUsIFByb3ZpZGVyfSBmcm9tICdhbmd1bGFyMi9zcmMvY29yZS9kaSc7XG5pbXBvcnQge0FwcFZpZXdMaXN0ZW5lcn0gZnJvbSAnYW5ndWxhcjIvc3JjL2NvcmUvbGlua2VyL3ZpZXdfbGlzdGVuZXInO1xuaW1wb3J0IHtBcHBWaWV3fSBmcm9tICdhbmd1bGFyMi9zcmMvY29yZS9saW5rZXIvdmlldyc7XG5pbXBvcnQge0RPTX0gZnJvbSAnYW5ndWxhcjIvc3JjL3BsYXRmb3JtL2RvbS9kb21fYWRhcHRlcic7XG5pbXBvcnQge1JlbmRlcmVyfSBmcm9tICdhbmd1bGFyMi9zcmMvY29yZS9yZW5kZXIvYXBpJztcbmltcG9ydCB7RGVidWdFbGVtZW50LCBEZWJ1Z0VsZW1lbnRffSBmcm9tICdhbmd1bGFyMi9zcmMvY29yZS9kZWJ1Zy9kZWJ1Z19lbGVtZW50JztcblxuY29uc3QgTkdfSURfUFJPUEVSVFkgPSAnbmdpZCc7XG5jb25zdCBJTlNQRUNUX0dMT0JBTF9OQU1FID0gJ25nLnByb2JlJztcblxuY29uc3QgTkdfSURfU0VQQVJBVE9SID0gJyMnO1xuXG4vLyBOZWVkIHRvIGtlZXAgdGhlIHZpZXdzIGluIGEgZ2xvYmFsIE1hcCBzbyB0aGF0IG11bHRpcGxlIGFuZ3VsYXIgYXBwcyBhcmUgc3VwcG9ydGVkXG52YXIgX2FsbElkc0J5VmlldyA9IG5ldyBNYXA8QXBwVmlldywgbnVtYmVyPigpO1xudmFyIF9hbGxWaWV3c0J5SWQgPSBuZXcgTWFwPG51bWJlciwgQXBwVmlldz4oKTtcblxudmFyIF9uZXh0SWQgPSAwO1xuXG5mdW5jdGlvbiBfc2V0RWxlbWVudElkKGVsZW1lbnQsIGluZGljZXM6IG51bWJlcltdKSB7XG4gIGlmIChpc1ByZXNlbnQoZWxlbWVudCkgJiYgRE9NLmlzRWxlbWVudE5vZGUoZWxlbWVudCkpIHtcbiAgICBET00uc2V0RGF0YShlbGVtZW50LCBOR19JRF9QUk9QRVJUWSwgaW5kaWNlcy5qb2luKE5HX0lEX1NFUEFSQVRPUikpO1xuICB9XG59XG5cbmZ1bmN0aW9uIF9nZXRFbGVtZW50SWQoZWxlbWVudCk6IG51bWJlcltdIHtcbiAgdmFyIGVsSWQgPSBET00uZ2V0RGF0YShlbGVtZW50LCBOR19JRF9QUk9QRVJUWSk7XG4gIGlmIChpc1ByZXNlbnQoZWxJZCkpIHtcbiAgICByZXR1cm4gZWxJZC5zcGxpdChOR19JRF9TRVBBUkFUT1IpLm1hcChwYXJ0U3RyID0+IE51bWJlcldyYXBwZXIucGFyc2VJbnQocGFydFN0ciwgMTApKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5zcGVjdE5hdGl2ZUVsZW1lbnQoZWxlbWVudCk6IERlYnVnRWxlbWVudCB7XG4gIHZhciBlbElkID0gX2dldEVsZW1lbnRJZChlbGVtZW50KTtcbiAgaWYgKGlzUHJlc2VudChlbElkKSkge1xuICAgIHZhciB2aWV3ID0gX2FsbFZpZXdzQnlJZC5nZXQoZWxJZFswXSk7XG4gICAgaWYgKGlzUHJlc2VudCh2aWV3KSkge1xuICAgICAgcmV0dXJuIG5ldyBEZWJ1Z0VsZW1lbnRfKHZpZXcsIGVsSWRbMV0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIERlYnVnRWxlbWVudFZpZXdMaXN0ZW5lciBpbXBsZW1lbnRzIEFwcFZpZXdMaXN0ZW5lciB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX3JlbmRlcmVyOiBSZW5kZXJlcikge1xuICAgIERPTS5zZXRHbG9iYWxWYXIoSU5TUEVDVF9HTE9CQUxfTkFNRSwgaW5zcGVjdE5hdGl2ZUVsZW1lbnQpO1xuICB9XG5cbiAgb25WaWV3Q3JlYXRlZCh2aWV3OiBBcHBWaWV3KSB7XG4gICAgdmFyIHZpZXdJZCA9IF9uZXh0SWQrKztcbiAgICBfYWxsVmlld3NCeUlkLnNldCh2aWV3SWQsIHZpZXcpO1xuICAgIF9hbGxJZHNCeVZpZXcuc2V0KHZpZXcsIHZpZXdJZCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2aWV3LmVsZW1lbnRSZWZzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgZWwgPSB2aWV3LmVsZW1lbnRSZWZzW2ldO1xuICAgICAgX3NldEVsZW1lbnRJZCh0aGlzLl9yZW5kZXJlci5nZXROYXRpdmVFbGVtZW50U3luYyhlbCksIFt2aWV3SWQsIGldKTtcbiAgICB9XG4gIH1cblxuICBvblZpZXdEZXN0cm95ZWQodmlldzogQXBwVmlldykge1xuICAgIHZhciB2aWV3SWQgPSBfYWxsSWRzQnlWaWV3LmdldCh2aWV3KTtcbiAgICBfYWxsSWRzQnlWaWV3LmRlbGV0ZSh2aWV3KTtcbiAgICBfYWxsVmlld3NCeUlkLmRlbGV0ZSh2aWV3SWQpO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBFTEVNRU5UX1BST0JFX1BST1ZJREVSUzogYW55W10gPSBDT05TVF9FWFBSKFtcbiAgRGVidWdFbGVtZW50Vmlld0xpc3RlbmVyLFxuICBDT05TVF9FWFBSKG5ldyBQcm92aWRlcihBcHBWaWV3TGlzdGVuZXIsIHt1c2VFeGlzdGluZzogRGVidWdFbGVtZW50Vmlld0xpc3RlbmVyfSkpLFxuXSk7XG5cbmV4cG9ydCBjb25zdCBFTEVNRU5UX1BST0JFX0JJTkRJTkdTID0gRUxFTUVOVF9QUk9CRV9QUk9WSURFUlM7XG4iXX0=