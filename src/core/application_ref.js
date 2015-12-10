'use strict';var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ng_zone_1 = require('angular2/src/core/zone/ng_zone');
var lang_1 = require('angular2/src/facade/lang');
var di_1 = require('angular2/src/core/di');
var application_tokens_1 = require('./application_tokens');
var async_1 = require('angular2/src/facade/async');
var collection_1 = require('angular2/src/facade/collection');
var testability_1 = require('angular2/src/core/testability/testability');
var dynamic_component_loader_1 = require('angular2/src/core/linker/dynamic_component_loader');
var exceptions_1 = require('angular2/src/facade/exceptions');
var view_ref_1 = require('angular2/src/core/linker/view_ref');
var profile_1 = require('./profile/profile');
var lang_2 = require('angular2/src/facade/lang');
/**
 * Construct providers specific to an individual root component.
 */
function _componentProviders(appComponentType) {
    return [
        di_1.provide(application_tokens_1.APP_COMPONENT, { useValue: appComponentType }),
        di_1.provide(application_tokens_1.APP_COMPONENT_REF_PROMISE, {
            useFactory: function (dynamicComponentLoader, appRef, injector) {
                // Save the ComponentRef for disposal later.
                var ref;
                // TODO(rado): investigate whether to support providers on root component.
                return dynamicComponentLoader.loadAsRoot(appComponentType, null, injector, function () { appRef._unloadComponent(ref); })
                    .then(function (componentRef) {
                    ref = componentRef;
                    if (lang_1.isPresent(componentRef.location.nativeElement)) {
                        injector.get(testability_1.TestabilityRegistry)
                            .registerApplication(componentRef.location.nativeElement, injector.get(testability_1.Testability));
                    }
                    return componentRef;
                });
            },
            deps: [dynamic_component_loader_1.DynamicComponentLoader, ApplicationRef, di_1.Injector]
        }),
        di_1.provide(appComponentType, {
            useFactory: function (p) { return p.then(function (ref) { return ref.instance; }); },
            deps: [application_tokens_1.APP_COMPONENT_REF_PROMISE]
        }),
    ];
}
/**
 * Create an Angular zone.
 */
function createNgZone() {
    return new ng_zone_1.NgZone({ enableLongStackTrace: lang_1.assertionsEnabled() });
}
exports.createNgZone = createNgZone;
var _platform;
var _platformProviders;
/**
 * Initialize the Angular 'platform' on the page.
 *
 * See {@link PlatformRef} for details on the Angular platform.
 *
 * It is also possible to specify providers to be made in the new platform. These providers
 * will be shared between all applications on the page. For example, an abstraction for
 * the browser cookie jar should be bound at the platform level, because there is only one
 * cookie jar regardless of how many applications on the page will be accessing it.
 *
 * The platform function can be called multiple times as long as the same list of providers
 * is passed into each call. If the platform function is called with a different set of
 * provides, Angular will throw an exception.
 */
function platform(providers) {
    lang_2.lockDevMode();
    if (lang_1.isPresent(_platform)) {
        if (collection_1.ListWrapper.equals(_platformProviders, providers)) {
            return _platform;
        }
        else {
            throw new exceptions_1.BaseException("platform cannot be initialized with different sets of providers.");
        }
    }
    else {
        return _createPlatform(providers);
    }
}
exports.platform = platform;
/**
 * Dispose the existing platform.
 */
function disposePlatform() {
    if (lang_1.isPresent(_platform)) {
        _platform.dispose();
        _platform = null;
    }
}
exports.disposePlatform = disposePlatform;
function _createPlatform(providers) {
    _platformProviders = providers;
    var injector = di_1.Injector.resolveAndCreate(providers);
    _platform = new PlatformRef_(injector, function () {
        _platform = null;
        _platformProviders = null;
    });
    _runPlatformInitializers(injector);
    return _platform;
}
function _runPlatformInitializers(injector) {
    var inits = injector.getOptional(application_tokens_1.PLATFORM_INITIALIZER);
    if (lang_1.isPresent(inits))
        inits.forEach(function (init) { return init(); });
}
/**
 * The Angular platform is the entry point for Angular on a web page. Each page
 * has exactly one platform, and services (such as reflection) which are common
 * to every Angular application running on the page are bound in its scope.
 *
 * A page's platform is initialized implicitly when {@link bootstrap}() is called, or
 * explicitly by calling {@link platform}().
 */
var PlatformRef = (function () {
    function PlatformRef() {
    }
    Object.defineProperty(PlatformRef.prototype, "injector", {
        /**
         * Retrieve the platform {@link Injector}, which is the parent injector for
         * every Angular application on the page and provides singleton providers.
         */
        get: function () { return exceptions_1.unimplemented(); },
        enumerable: true,
        configurable: true
    });
    ;
    return PlatformRef;
})();
exports.PlatformRef = PlatformRef;
var PlatformRef_ = (function (_super) {
    __extends(PlatformRef_, _super);
    function PlatformRef_(_injector, _dispose) {
        _super.call(this);
        this._injector = _injector;
        this._dispose = _dispose;
        /** @internal */
        this._applications = [];
        /** @internal */
        this._disposeListeners = [];
    }
    PlatformRef_.prototype.registerDisposeListener = function (dispose) { this._disposeListeners.push(dispose); };
    Object.defineProperty(PlatformRef_.prototype, "injector", {
        get: function () { return this._injector; },
        enumerable: true,
        configurable: true
    });
    PlatformRef_.prototype.application = function (providers) {
        var app = this._initApp(createNgZone(), providers);
        return app;
    };
    PlatformRef_.prototype.asyncApplication = function (bindingFn, additionalProviders) {
        var _this = this;
        var zone = createNgZone();
        var completer = async_1.PromiseWrapper.completer();
        zone.run(function () {
            async_1.PromiseWrapper.then(bindingFn(zone), function (providers) {
                if (lang_1.isPresent(additionalProviders)) {
                    providers = collection_1.ListWrapper.concat(providers, additionalProviders);
                }
                completer.resolve(_this._initApp(zone, providers));
            });
        });
        return completer.promise;
    };
    PlatformRef_.prototype._initApp = function (zone, providers) {
        var _this = this;
        var injector;
        var app;
        zone.run(function () {
            providers = collection_1.ListWrapper.concat(providers, [
                di_1.provide(ng_zone_1.NgZone, { useValue: zone }),
                di_1.provide(ApplicationRef, { useFactory: function () { return app; }, deps: [] })
            ]);
            var exceptionHandler;
            try {
                injector = _this.injector.resolveAndCreateChild(providers);
                exceptionHandler = injector.get(exceptions_1.ExceptionHandler);
                zone.overrideOnErrorHandler(function (e, s) { return exceptionHandler.call(e, s); });
            }
            catch (e) {
                if (lang_1.isPresent(exceptionHandler)) {
                    exceptionHandler.call(e, e.stack);
                }
                else {
                    lang_1.print(e.toString());
                }
            }
        });
        app = new ApplicationRef_(this, zone, injector);
        this._applications.push(app);
        _runAppInitializers(injector);
        return app;
    };
    PlatformRef_.prototype.dispose = function () {
        collection_1.ListWrapper.clone(this._applications).forEach(function (app) { return app.dispose(); });
        this._disposeListeners.forEach(function (dispose) { return dispose(); });
        this._dispose();
    };
    /** @internal */
    PlatformRef_.prototype._applicationDisposed = function (app) { collection_1.ListWrapper.remove(this._applications, app); };
    return PlatformRef_;
})(PlatformRef);
exports.PlatformRef_ = PlatformRef_;
function _runAppInitializers(injector) {
    var inits = injector.getOptional(application_tokens_1.APP_INITIALIZER);
    if (lang_1.isPresent(inits))
        inits.forEach(function (init) { return init(); });
}
/**
 * A reference to an Angular application running on a page.
 *
 * For more about Angular applications, see the documentation for {@link bootstrap}.
 */
var ApplicationRef = (function () {
    function ApplicationRef() {
    }
    Object.defineProperty(ApplicationRef.prototype, "injector", {
        /**
         * Retrieve the application {@link Injector}.
         */
        get: function () { return exceptions_1.unimplemented(); },
        enumerable: true,
        configurable: true
    });
    ;
    Object.defineProperty(ApplicationRef.prototype, "zone", {
        /**
         * Retrieve the application {@link NgZone}.
         */
        get: function () { return exceptions_1.unimplemented(); },
        enumerable: true,
        configurable: true
    });
    ;
    Object.defineProperty(ApplicationRef.prototype, "componentTypes", {
        /**
         * Get a list of component types registered to this application.
         */
        get: function () { return exceptions_1.unimplemented(); },
        enumerable: true,
        configurable: true
    });
    ;
    return ApplicationRef;
})();
exports.ApplicationRef = ApplicationRef;
var ApplicationRef_ = (function (_super) {
    __extends(ApplicationRef_, _super);
    function ApplicationRef_(_platform, _zone, _injector) {
        var _this = this;
        _super.call(this);
        this._platform = _platform;
        this._zone = _zone;
        this._injector = _injector;
        /** @internal */
        this._bootstrapListeners = [];
        /** @internal */
        this._disposeListeners = [];
        /** @internal */
        this._rootComponents = [];
        /** @internal */
        this._rootComponentTypes = [];
        /** @internal */
        this._changeDetectorRefs = [];
        /** @internal */
        this._runningTick = false;
        /** @internal */
        this._enforceNoNewChanges = false;
        if (lang_1.isPresent(this._zone)) {
            async_1.ObservableWrapper.subscribe(this._zone.onTurnDone, function (_) { _this._zone.run(function () { _this.tick(); }); });
        }
        this._enforceNoNewChanges = lang_1.assertionsEnabled();
    }
    ApplicationRef_.prototype.registerBootstrapListener = function (listener) {
        this._bootstrapListeners.push(listener);
    };
    ApplicationRef_.prototype.registerDisposeListener = function (dispose) { this._disposeListeners.push(dispose); };
    ApplicationRef_.prototype.registerChangeDetector = function (changeDetector) {
        this._changeDetectorRefs.push(changeDetector);
    };
    ApplicationRef_.prototype.unregisterChangeDetector = function (changeDetector) {
        collection_1.ListWrapper.remove(this._changeDetectorRefs, changeDetector);
    };
    ApplicationRef_.prototype.bootstrap = function (componentType, providers) {
        var _this = this;
        var completer = async_1.PromiseWrapper.completer();
        this._zone.run(function () {
            var componentProviders = _componentProviders(componentType);
            if (lang_1.isPresent(providers)) {
                componentProviders.push(providers);
            }
            var exceptionHandler = _this._injector.get(exceptions_1.ExceptionHandler);
            _this._rootComponentTypes.push(componentType);
            try {
                var injector = _this._injector.resolveAndCreateChild(componentProviders);
                var compRefToken = injector.get(application_tokens_1.APP_COMPONENT_REF_PROMISE);
                var tick = function (componentRef) {
                    _this._loadComponent(componentRef);
                    completer.resolve(componentRef);
                };
                var tickResult = async_1.PromiseWrapper.then(compRefToken, tick);
                // THIS MUST ONLY RUN IN DART.
                // This is required to report an error when no components with a matching selector found.
                // Otherwise the promise will never be completed.
                // Doing this in JS causes an extra error message to appear.
                if (lang_1.IS_DART) {
                    async_1.PromiseWrapper.then(tickResult, function (_) { });
                }
                async_1.PromiseWrapper.then(tickResult, null, function (err, stackTrace) { return completer.reject(err, stackTrace); });
            }
            catch (e) {
                exceptionHandler.call(e, e.stack);
                completer.reject(e, e.stack);
            }
        });
        return completer.promise;
    };
    /** @internal */
    ApplicationRef_.prototype._loadComponent = function (ref) {
        var appChangeDetector = view_ref_1.internalView(ref.hostView).changeDetector;
        this._changeDetectorRefs.push(appChangeDetector.ref);
        this.tick();
        this._rootComponents.push(ref);
        this._bootstrapListeners.forEach(function (listener) { return listener(ref); });
    };
    /** @internal */
    ApplicationRef_.prototype._unloadComponent = function (ref) {
        if (!collection_1.ListWrapper.contains(this._rootComponents, ref)) {
            return;
        }
        this.unregisterChangeDetector(view_ref_1.internalView(ref.hostView).changeDetector.ref);
        collection_1.ListWrapper.remove(this._rootComponents, ref);
    };
    Object.defineProperty(ApplicationRef_.prototype, "injector", {
        get: function () { return this._injector; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ApplicationRef_.prototype, "zone", {
        get: function () { return this._zone; },
        enumerable: true,
        configurable: true
    });
    ApplicationRef_.prototype.tick = function () {
        if (this._runningTick) {
            throw new exceptions_1.BaseException("ApplicationRef.tick is called recursively");
        }
        var s = ApplicationRef_._tickScope();
        try {
            this._runningTick = true;
            this._changeDetectorRefs.forEach(function (detector) { return detector.detectChanges(); });
            if (this._enforceNoNewChanges) {
                this._changeDetectorRefs.forEach(function (detector) { return detector.checkNoChanges(); });
            }
        }
        finally {
            this._runningTick = false;
            profile_1.wtfLeave(s);
        }
    };
    ApplicationRef_.prototype.dispose = function () {
        // TODO(alxhub): Dispose of the NgZone.
        collection_1.ListWrapper.clone(this._rootComponents).forEach(function (ref) { return ref.dispose(); });
        this._disposeListeners.forEach(function (dispose) { return dispose(); });
        this._platform._applicationDisposed(this);
    };
    Object.defineProperty(ApplicationRef_.prototype, "componentTypes", {
        get: function () { return this._rootComponentTypes; },
        enumerable: true,
        configurable: true
    });
    /** @internal */
    ApplicationRef_._tickScope = profile_1.wtfCreateScope('ApplicationRef#tick()');
    return ApplicationRef_;
})(ApplicationRef);
exports.ApplicationRef_ = ApplicationRef_;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25fcmVmLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYW5ndWxhcjIvc3JjL2NvcmUvYXBwbGljYXRpb25fcmVmLnRzIl0sIm5hbWVzIjpbIl9jb21wb25lbnRQcm92aWRlcnMiLCJjcmVhdGVOZ1pvbmUiLCJwbGF0Zm9ybSIsImRpc3Bvc2VQbGF0Zm9ybSIsIl9jcmVhdGVQbGF0Zm9ybSIsIl9ydW5QbGF0Zm9ybUluaXRpYWxpemVycyIsIlBsYXRmb3JtUmVmIiwiUGxhdGZvcm1SZWYuY29uc3RydWN0b3IiLCJQbGF0Zm9ybVJlZi5pbmplY3RvciIsIlBsYXRmb3JtUmVmXyIsIlBsYXRmb3JtUmVmXy5jb25zdHJ1Y3RvciIsIlBsYXRmb3JtUmVmXy5yZWdpc3RlckRpc3Bvc2VMaXN0ZW5lciIsIlBsYXRmb3JtUmVmXy5pbmplY3RvciIsIlBsYXRmb3JtUmVmXy5hcHBsaWNhdGlvbiIsIlBsYXRmb3JtUmVmXy5hc3luY0FwcGxpY2F0aW9uIiwiUGxhdGZvcm1SZWZfLl9pbml0QXBwIiwiUGxhdGZvcm1SZWZfLmRpc3Bvc2UiLCJQbGF0Zm9ybVJlZl8uX2FwcGxpY2F0aW9uRGlzcG9zZWQiLCJfcnVuQXBwSW5pdGlhbGl6ZXJzIiwiQXBwbGljYXRpb25SZWYiLCJBcHBsaWNhdGlvblJlZi5jb25zdHJ1Y3RvciIsIkFwcGxpY2F0aW9uUmVmLmluamVjdG9yIiwiQXBwbGljYXRpb25SZWYuem9uZSIsIkFwcGxpY2F0aW9uUmVmLmNvbXBvbmVudFR5cGVzIiwiQXBwbGljYXRpb25SZWZfIiwiQXBwbGljYXRpb25SZWZfLmNvbnN0cnVjdG9yIiwiQXBwbGljYXRpb25SZWZfLnJlZ2lzdGVyQm9vdHN0cmFwTGlzdGVuZXIiLCJBcHBsaWNhdGlvblJlZl8ucmVnaXN0ZXJEaXNwb3NlTGlzdGVuZXIiLCJBcHBsaWNhdGlvblJlZl8ucmVnaXN0ZXJDaGFuZ2VEZXRlY3RvciIsIkFwcGxpY2F0aW9uUmVmXy51bnJlZ2lzdGVyQ2hhbmdlRGV0ZWN0b3IiLCJBcHBsaWNhdGlvblJlZl8uYm9vdHN0cmFwIiwiQXBwbGljYXRpb25SZWZfLl9sb2FkQ29tcG9uZW50IiwiQXBwbGljYXRpb25SZWZfLl91bmxvYWRDb21wb25lbnQiLCJBcHBsaWNhdGlvblJlZl8uaW5qZWN0b3IiLCJBcHBsaWNhdGlvblJlZl8uem9uZSIsIkFwcGxpY2F0aW9uUmVmXy50aWNrIiwiQXBwbGljYXRpb25SZWZfLmRpc3Bvc2UiLCJBcHBsaWNhdGlvblJlZl8uY29tcG9uZW50VHlwZXMiXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsd0JBQXFCLGdDQUFnQyxDQUFDLENBQUE7QUFDdEQscUJBT08sMEJBQTBCLENBQUMsQ0FBQTtBQUNsQyxtQkFBdUQsc0JBQXNCLENBQUMsQ0FBQTtBQUM5RSxtQ0FNTyxzQkFBc0IsQ0FBQyxDQUFBO0FBQzlCLHNCQUtPLDJCQUEyQixDQUFDLENBQUE7QUFDbkMsMkJBQTBCLGdDQUFnQyxDQUFDLENBQUE7QUFDM0QsNEJBQStDLDJDQUEyQyxDQUFDLENBQUE7QUFDM0YseUNBR08sbURBQW1ELENBQUMsQ0FBQTtBQUMzRCwyQkFLTyxnQ0FBZ0MsQ0FBQyxDQUFBO0FBQ3hDLHlCQUEyQixtQ0FBbUMsQ0FBQyxDQUFBO0FBQy9ELHdCQUFtRCxtQkFBbUIsQ0FBQyxDQUFBO0FBRXZFLHFCQUEwQiwwQkFBMEIsQ0FBQyxDQUFBO0FBRXJEOztHQUVHO0FBQ0gsNkJBQTZCLGdCQUFzQjtJQUNqREEsTUFBTUEsQ0FBQ0E7UUFDTEEsWUFBT0EsQ0FBQ0Esa0NBQWFBLEVBQUVBLEVBQUNBLFFBQVFBLEVBQUVBLGdCQUFnQkEsRUFBQ0EsQ0FBQ0E7UUFDcERBLFlBQU9BLENBQUNBLDhDQUF5QkEsRUFDekJBO1lBQ0VBLFVBQVVBLEVBQUVBLFVBQUNBLHNCQUE4Q0EsRUFBRUEsTUFBdUJBLEVBQ3ZFQSxRQUFrQkE7Z0JBQzdCQSw0Q0FBNENBO2dCQUM1Q0EsSUFBSUEsR0FBaUJBLENBQUNBO2dCQUN0QkEsMEVBQTBFQTtnQkFDMUVBLE1BQU1BLENBQUNBLHNCQUFz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QSxDQUFDQSxDQUFDQSxDQUFDQTtRQUNkQSxDQUFDQTtJQUNIQSxDQUFDQTtJQUVEWCxpQ0FBT0EsR0FBUEE7UUFDRVksdUNBQXVDQTtRQUN2Q0Esd0JBQVdBLENBQUNBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLGVBQWVBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLFVBQUNBLEdBQUdBLElBQUtBLE9BQUFBLEdBQUdBLENBQUNBLE9BQU9BLEVBQUVBLEVBQWJBLENBQWFBLENBQUNBLENBQUNBO1FBQ3hFQSxJQUFJQSxDQUFDQSxpQkFBaUJBLENBQUNBLE9BQU9BLENBQUNBLFVBQUNBLE9BQU9BLElBQUtBLE9BQUFBLE9BQU9BLEVBQUVBLEVBQVRBLENBQVNBLENBQUNBLENBQUNBO1FBQ3ZEQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxvQkFBb0JBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO0lBQzVDQSxDQUFDQTtJQUVEWixzQkFBSUEsMkNBQWNBO2FBQWxCQSxjQUE4QmEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsbUJBQW1CQSxDQUFDQSxDQUFDQSxDQUFDQTs7O09BQUFiO0lBOUhoRUEsZ0JBQWdCQTtJQUNUQSwwQkFBVUEsR0FBZUEsd0JBQWNBLENBQUNBLHVCQUF1QkEsQ0FBQ0EsQ0FBQ0E7SUE4SDFFQSxzQkFBQ0E7QUFBREEsQ0FBQ0EsQUFoSUQsRUFBcUMsY0FBYyxFQWdJbEQ7QUFoSVksdUJBQWUsa0JBZ0kzQixDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtOZ1pvbmV9IGZyb20gJ2FuZ3VsYXIyL3NyYy9jb3JlL3pvbmUvbmdfem9uZSc7XG5pbXBvcnQge1xuICBUeXBlLFxuICBpc0JsYW5rLFxuICBpc1ByZXNlbnQsXG4gIGFzc2VydGlvbnNFbmFibGVkLFxuICBwcmludCxcbiAgSVNfREFSVFxufSBmcm9tICdhbmd1bGFyMi9zcmMvZmFjYWRlL2xhbmcnO1xuaW1wb3J0IHtwcm92aWRlLCBQcm92aWRlciwgSW5qZWN0b3IsIE9wYXF1ZVRva2VufSBmcm9tICdhbmd1bGFyMi9zcmMvY29yZS9kaSc7XG5pbXBvcnQge1xuICBBUFBfQ09NUE9ORU5UX1JFRl9QUk9NSVNFLFxuICBBUFBfQ09NUE9ORU5ULFxuICBBUFBfSURfUkFORE9NX1BST1ZJREVSLFxuICBQTEFURk9STV9JTklUSUFMSVpFUixcbiAgQVBQX0lOSVRJQUxJWkVSXG59IGZyb20gJy4vYXBwbGljYXRpb25fdG9rZW5zJztcbmltcG9ydCB7XG4gIFByb21pc2UsXG4gIFByb21pc2VXcmFwcGVyLFxuICBQcm9taXNlQ29tcGxldGVyLFxuICBPYnNlcnZhYmxlV3JhcHBlclxufSBmcm9tICdhbmd1bGFyMi9zcmMvZmFjYWRlL2FzeW5jJztcbmltcG9ydCB7TGlzdFdyYXBwZXJ9IGZyb20gJ2FuZ3VsYXIyL3NyYy9mYWNhZGUvY29sbGVjdGlvbic7XG5pbXBvcnQge1Rlc3RhYmlsaXR5UmVnaXN0cnksIFRlc3RhYmlsaXR5fSBmcm9tICdhbmd1bGFyMi9zcmMvY29yZS90ZXN0YWJpbGl0eS90ZXN0YWJpbGl0eSc7XG5pbXBvcnQge1xuICBDb21wb25lbnRSZWYsXG4gIER5bmFtaWNDb21wb25lbnRMb2FkZXJcbn0gZnJvbSAnYW5ndWxhcjIvc3JjL2NvcmUvbGlua2VyL2R5bmFtaWNfY29tcG9uZW50X2xvYWRlcic7XG5pbXBvcnQge1xuICBCYXNlRXhjZXB0aW9uLFxuICBXcmFwcGVkRXhjZXB0aW9uLFxuICBFeGNlcHRpb25IYW5kbGVyLFxuICB1bmltcGxlbWVudGVkXG59IGZyb20gJ2FuZ3VsYXIyL3NyYy9mYWNhZGUvZXhjZXB0aW9ucyc7XG5pbXBvcnQge2ludGVybmFsVmlld30gZnJvbSAnYW5ndWxhcjIvc3JjL2NvcmUvbGlua2VyL3ZpZXdfcmVmJztcbmltcG9ydCB7d3RmTGVhdmUsIHd0ZkNyZWF0ZVNjb3BlLCBXdGZTY29wZUZufSBmcm9tICcuL3Byb2ZpbGUvcHJvZmlsZSc7XG5pbXBvcnQge0NoYW5nZURldGVjdG9yUmVmfSBmcm9tICdhbmd1bGFyMi9zcmMvY29yZS9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rvcl9yZWYnO1xuaW1wb3J0IHtsb2NrRGV2TW9kZX0gZnJvbSAnYW5ndWxhcjIvc3JjL2ZhY2FkZS9sYW5nJztcblxuLyoqXG4gKiBDb25zdHJ1Y3QgcHJvdmlkZXJzIHNwZWNpZmljIHRvIGFuIGluZGl2aWR1YWwgcm9vdCBjb21wb25lbnQuXG4gKi9cbmZ1bmN0aW9uIF9jb21wb25lbnRQcm92aWRlcnMoYXBwQ29tcG9uZW50VHlwZTogVHlwZSk6IEFycmF5PFR5cGUgfCBQcm92aWRlciB8IGFueVtdPiB7XG4gIHJldHVybiBbXG4gICAgcHJvdmlkZShBUFBfQ09NUE9ORU5ULCB7dXNlVmFsdWU6IGFwcENvbXBvbmVudFR5cGV9KSxcbiAgICBwcm92aWRlKEFQUF9DT01QT05FTlRfUkVGX1BST01JU0UsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHVzZUZhY3Rvcnk6IChkeW5hbWljQ29tcG9uZW50TG9hZGVyOiBEeW5hbWljQ29tcG9uZW50TG9hZGVyLCBhcHBSZWY6IEFwcGxpY2F0aW9uUmVmXyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGluamVjdG9yOiBJbmplY3RvcikgPT4ge1xuICAgICAgICAgICAgICAgIC8vIFNhdmUgdGhlIENvbXBvbmVudFJlZiBmb3IgZGlzcG9zYWwgbGF0ZXIuXG4gICAgICAgICAgICAgICAgdmFyIHJlZjogQ29tcG9uZW50UmVmO1xuICAgICAgICAgICAgICAgIC8vIFRPRE8ocmFkbyk6IGludmVzdGlnYXRlIHdoZXRoZXIgdG8gc3VwcG9ydCBwcm92aWRlcnMgb24gcm9vdCBjb21wb25lbnQuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGR5bmFtaWNDb21wb25lbnRMb2FkZXIubG9hZEFzUm9vdChhcHBDb21wb25lbnRUeXBlLCBudWxsLCBpbmplY3RvcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICgpID0+IHsgYXBwUmVmLl91bmxvYWRDb21wb25lbnQocmVmKTsgfSlcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oKGNvbXBvbmVudFJlZikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgIHJlZiA9IGNvbXBvbmVudFJlZjtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNQcmVzZW50KGNvbXBvbmVudFJlZi5sb2NhdGlvbi5uYXRpdmVFbGVtZW50KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5qZWN0b3IuZ2V0KFRlc3RhYmlsaXR5UmVnaXN0cnkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlZ2lzdGVyQXBwbGljYXRpb24oY29tcG9uZW50UmVmLmxvY2F0aW9uLm5hdGl2ZUVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5qZWN0b3IuZ2V0KFRlc3RhYmlsaXR5KSk7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb21wb25lbnRSZWY7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBkZXBzOiBbRHluYW1pY0NvbXBvbmVudExvYWRlciwgQXBwbGljYXRpb25SZWYsIEluamVjdG9yXVxuICAgICAgICAgICAgfSksXG4gICAgcHJvdmlkZShhcHBDb21wb25lbnRUeXBlLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICB1c2VGYWN0b3J5OiAocDogUHJvbWlzZTxhbnk+KSA9PiBwLnRoZW4ocmVmID0+IHJlZi5pbnN0YW5jZSksXG4gICAgICAgICAgICAgIGRlcHM6IFtBUFBfQ09NUE9ORU5UX1JFRl9QUk9NSVNFXVxuICAgICAgICAgICAgfSksXG4gIF07XG59XG5cbi8qKlxuICogQ3JlYXRlIGFuIEFuZ3VsYXIgem9uZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5nWm9uZSgpOiBOZ1pvbmUge1xuICByZXR1cm4gbmV3IE5nWm9uZSh7ZW5hYmxlTG9uZ1N0YWNrVHJhY2U6IGFzc2VydGlvbnNFbmFibGVkKCl9KTtcbn1cblxudmFyIF9wbGF0Zm9ybTogUGxhdGZvcm1SZWY7XG52YXIgX3BsYXRmb3JtUHJvdmlkZXJzOiBhbnlbXTtcblxuLyoqXG4gKiBJbml0aWFsaXplIHRoZSBBbmd1bGFyICdwbGF0Zm9ybScgb24gdGhlIHBhZ2UuXG4gKlxuICogU2VlIHtAbGluayBQbGF0Zm9ybVJlZn0gZm9yIGRldGFpbHMgb24gdGhlIEFuZ3VsYXIgcGxhdGZvcm0uXG4gKlxuICogSXQgaXMgYWxzbyBwb3NzaWJsZSB0byBzcGVjaWZ5IHByb3ZpZGVycyB0byBiZSBtYWRlIGluIHRoZSBuZXcgcGxhdGZvcm0uIFRoZXNlIHByb3ZpZGVyc1xuICogd2lsbCBiZSBzaGFyZWQgYmV0d2VlbiBhbGwgYXBwbGljYXRpb25zIG9uIHRoZSBwYWdlLiBGb3IgZXhhbXBsZSwgYW4gYWJzdHJhY3Rpb24gZm9yXG4gKiB0aGUgYnJvd3NlciBjb29raWUgamFyIHNob3VsZCBiZSBib3VuZCBhdCB0aGUgcGxhdGZvcm0gbGV2ZWwsIGJlY2F1c2UgdGhlcmUgaXMgb25seSBvbmVcbiAqIGNvb2tpZSBqYXIgcmVnYXJkbGVzcyBvZiBob3cgbWFueSBhcHBsaWNhdGlvbnMgb24gdGhlIHBhZ2Ugd2lsbCBiZSBhY2Nlc3NpbmcgaXQuXG4gKlxuICogVGhlIHBsYXRmb3JtIGZ1bmN0aW9uIGNhbiBiZSBjYWxsZWQgbXVsdGlwbGUgdGltZXMgYXMgbG9uZyBhcyB0aGUgc2FtZSBsaXN0IG9mIHByb3ZpZGVyc1xuICogaXMgcGFzc2VkIGludG8gZWFjaCBjYWxsLiBJZiB0aGUgcGxhdGZvcm0gZnVuY3Rpb24gaXMgY2FsbGVkIHdpdGggYSBkaWZmZXJlbnQgc2V0IG9mXG4gKiBwcm92aWRlcywgQW5ndWxhciB3aWxsIHRocm93IGFuIGV4Y2VwdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBsYXRmb3JtKHByb3ZpZGVycz86IEFycmF5PFR5cGUgfCBQcm92aWRlciB8IGFueVtdPik6IFBsYXRmb3JtUmVmIHtcbiAgbG9ja0Rldk1vZGUoKTtcbiAgaWYgKGlzUHJlc2VudChfcGxhdGZvcm0pKSB7XG4gICAgaWYgKExpc3RXcmFwcGVyLmVxdWFscyhfcGxhdGZvcm1Qcm92aWRlcnMsIHByb3ZpZGVycykpIHtcbiAgICAgIHJldHVybiBfcGxhdGZvcm07XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBCYXNlRXhjZXB0aW9uKFwicGxhdGZvcm0gY2Fubm90IGJlIGluaXRpYWxpemVkIHdpdGggZGlmZmVyZW50IHNldHMgb2YgcHJvdmlkZXJzLlwiKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIF9jcmVhdGVQbGF0Zm9ybShwcm92aWRlcnMpO1xuICB9XG59XG5cbi8qKlxuICogRGlzcG9zZSB0aGUgZXhpc3RpbmcgcGxhdGZvcm0uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXNwb3NlUGxhdGZvcm0oKTogdm9pZCB7XG4gIGlmIChpc1ByZXNlbnQoX3BsYXRmb3JtKSkge1xuICAgIF9wbGF0Zm9ybS5kaXNwb3NlKCk7XG4gICAgX3BsYXRmb3JtID0gbnVsbDtcbiAgfVxufVxuXG5mdW5jdGlvbiBfY3JlYXRlUGxhdGZvcm0ocHJvdmlkZXJzPzogQXJyYXk8VHlwZSB8IFByb3ZpZGVyIHwgYW55W10+KTogUGxhdGZvcm1SZWYge1xuICBfcGxhdGZvcm1Qcm92aWRlcnMgPSBwcm92aWRlcnM7XG4gIGxldCBpbmplY3RvciA9IEluamVjdG9yLnJlc29sdmVBbmRDcmVhdGUocHJvdmlkZXJzKTtcbiAgX3BsYXRmb3JtID0gbmV3IFBsYXRmb3JtUmVmXyhpbmplY3RvciwgKCkgPT4ge1xuICAgIF9wbGF0Zm9ybSA9IG51bGw7XG4gICAgX3BsYXRmb3JtUHJvdmlkZXJzID0gbnVsbDtcbiAgfSk7XG4gIF9ydW5QbGF0Zm9ybUluaXRpYWxpemVycyhpbmplY3Rvcik7XG4gIHJldHVybiBfcGxhdGZvcm07XG59XG5cbmZ1bmN0aW9uIF9ydW5QbGF0Zm9ybUluaXRpYWxpemVycyhpbmplY3RvcjogSW5qZWN0b3IpOiB2b2lkIHtcbiAgbGV0IGluaXRzOiBGdW5jdGlvbltdID0gaW5qZWN0b3IuZ2V0T3B0aW9uYWwoUExBVEZPUk1fSU5JVElBTElaRVIpO1xuICBpZiAoaXNQcmVzZW50KGluaXRzKSkgaW5pdHMuZm9yRWFjaChpbml0ID0+IGluaXQoKSk7XG59XG5cbi8qKlxuICogVGhlIEFuZ3VsYXIgcGxhdGZvcm0gaXMgdGhlIGVudHJ5IHBvaW50IGZvciBBbmd1bGFyIG9uIGEgd2ViIHBhZ2UuIEVhY2ggcGFnZVxuICogaGFzIGV4YWN0bHkgb25lIHBsYXRmb3JtLCBhbmQgc2VydmljZXMgKHN1Y2ggYXMgcmVmbGVjdGlvbikgd2hpY2ggYXJlIGNvbW1vblxuICogdG8gZXZlcnkgQW5ndWxhciBhcHBsaWNhdGlvbiBydW5uaW5nIG9uIHRoZSBwYWdlIGFyZSBib3VuZCBpbiBpdHMgc2NvcGUuXG4gKlxuICogQSBwYWdlJ3MgcGxhdGZvcm0gaXMgaW5pdGlhbGl6ZWQgaW1wbGljaXRseSB3aGVuIHtAbGluayBib290c3RyYXB9KCkgaXMgY2FsbGVkLCBvclxuICogZXhwbGljaXRseSBieSBjYWxsaW5nIHtAbGluayBwbGF0Zm9ybX0oKS5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFBsYXRmb3JtUmVmIHtcbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGEgbGlzdGVuZXIgdG8gYmUgY2FsbGVkIHdoZW4gdGhlIHBsYXRmb3JtIGlzIGRpc3Bvc2VkLlxuICAgKi9cbiAgYWJzdHJhY3QgcmVnaXN0ZXJEaXNwb3NlTGlzdGVuZXIoZGlzcG9zZTogKCkgPT4gdm9pZCk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlIHRoZSBwbGF0Zm9ybSB7QGxpbmsgSW5qZWN0b3J9LCB3aGljaCBpcyB0aGUgcGFyZW50IGluamVjdG9yIGZvclxuICAgKiBldmVyeSBBbmd1bGFyIGFwcGxpY2F0aW9uIG9uIHRoZSBwYWdlIGFuZCBwcm92aWRlcyBzaW5nbGV0b24gcHJvdmlkZXJzLlxuICAgKi9cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHsgcmV0dXJuIHVuaW1wbGVtZW50ZWQoKTsgfTtcblxuICAvKipcbiAgICogSW5zdGFudGlhdGUgYSBuZXcgQW5ndWxhciBhcHBsaWNhdGlvbiBvbiB0aGUgcGFnZS5cbiAgICpcbiAgICogIyMjIFdoYXQgaXMgYW4gYXBwbGljYXRpb24/XG4gICAqXG4gICAqIEVhY2ggQW5ndWxhciBhcHBsaWNhdGlvbiBoYXMgaXRzIG93biB6b25lLCBjaGFuZ2UgZGV0ZWN0aW9uLCBjb21waWxlcixcbiAgICogcmVuZGVyZXIsIGFuZCBvdGhlciBmcmFtZXdvcmsgY29tcG9uZW50cy4gQW4gYXBwbGljYXRpb24gaG9zdHMgb25lIG9yIG1vcmVcbiAgICogcm9vdCBjb21wb25lbnRzLCB3aGljaCBjYW4gYmUgaW5pdGlhbGl6ZWQgdmlhIGBBcHBsaWNhdGlvblJlZi5ib290c3RyYXAoKWAuXG4gICAqXG4gICAqICMjIyBBcHBsaWNhdGlvbiBQcm92aWRlcnNcbiAgICpcbiAgICogQW5ndWxhciBhcHBsaWNhdGlvbnMgcmVxdWlyZSBudW1lcm91cyBwcm92aWRlcnMgdG8gYmUgcHJvcGVybHkgaW5zdGFudGlhdGVkLlxuICAgKiBXaGVuIHVzaW5nIGBhcHBsaWNhdGlvbigpYCB0byBjcmVhdGUgYSBuZXcgYXBwIG9uIHRoZSBwYWdlLCB0aGVzZSBwcm92aWRlcnNcbiAgICogbXVzdCBiZSBwcm92aWRlZC4gRm9ydHVuYXRlbHksIHRoZXJlIGFyZSBoZWxwZXIgZnVuY3Rpb25zIHRvIGNvbmZpZ3VyZVxuICAgKiB0eXBpY2FsIHByb3ZpZGVycywgYXMgc2hvd24gaW4gdGhlIGV4YW1wbGUgYmVsb3cuXG4gICAqXG4gICAqICMjIyBFeGFtcGxlXG4gICAqIGBgYFxuICAgKiB2YXIgbXlBcHBQcm92aWRlcnMgPSBbTXlBcHBTZXJ2aWNlXTtcbiAgICpcbiAgICogcGxhdGZvcm0oKVxuICAgKiAgIC5hcHBsaWNhdGlvbihbbXlBcHBQcm92aWRlcnNdKVxuICAgKiAgIC5ib290c3RyYXAoTXlUb3BMZXZlbENvbXBvbmVudCk7XG4gICAqIGBgYFxuICAgKiAjIyMgU2VlIEFsc29cbiAgICpcbiAgICogU2VlIHRoZSB7QGxpbmsgYm9vdHN0cmFwfSBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGRldGFpbHMuXG4gICAqL1xuICBhYnN0cmFjdCBhcHBsaWNhdGlvbihwcm92aWRlcnM6IEFycmF5PFR5cGUgfCBQcm92aWRlciB8IGFueVtdPik6IEFwcGxpY2F0aW9uUmVmO1xuXG4gIC8qKlxuICAgKiBJbnN0YW50aWF0ZSBhIG5ldyBBbmd1bGFyIGFwcGxpY2F0aW9uIG9uIHRoZSBwYWdlLCB1c2luZyBwcm92aWRlcnMgd2hpY2hcbiAgICogYXJlIG9ubHkgYXZhaWxhYmxlIGFzeW5jaHJvbm91c2x5LiBPbmUgc3VjaCB1c2UgY2FzZSBpcyB0byBpbml0aWFsaXplIGFuXG4gICAqIGFwcGxpY2F0aW9uIHJ1bm5pbmcgaW4gYSB3ZWIgd29ya2VyLlxuICAgKlxuICAgKiAjIyMgVXNhZ2VcbiAgICpcbiAgICogYGJpbmRpbmdGbmAgaXMgYSBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgY2FsbGVkIGluIHRoZSBuZXcgYXBwbGljYXRpb24ncyB6b25lLlxuICAgKiBJdCBzaG91bGQgcmV0dXJuIGEgYFByb21pc2VgIHRvIGEgbGlzdCBvZiBwcm92aWRlcnMgdG8gYmUgdXNlZCBmb3IgdGhlXG4gICAqIG5ldyBhcHBsaWNhdGlvbi4gT25jZSB0aGlzIHByb21pc2UgcmVzb2x2ZXMsIHRoZSBhcHBsaWNhdGlvbiB3aWxsIGJlXG4gICAqIGNvbnN0cnVjdGVkIGluIHRoZSBzYW1lIG1hbm5lciBhcyBhIG5vcm1hbCBgYXBwbGljYXRpb24oKWAuXG4gICAqL1xuICBhYnN0cmFjdCBhc3luY0FwcGxpY2F0aW9uKGJpbmRpbmdGbjogKHpvbmU6IE5nWm9uZSkgPT4gUHJvbWlzZTxBcnJheTxUeXBlIHwgUHJvdmlkZXIgfCBhbnlbXT4+LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3ZpZGVycz86IEFycmF5PFR5cGUgfCBQcm92aWRlciB8IGFueVtdPik6IFByb21pc2U8QXBwbGljYXRpb25SZWY+O1xuXG4gIC8qKlxuICAgKiBEZXN0cm95IHRoZSBBbmd1bGFyIHBsYXRmb3JtIGFuZCBhbGwgQW5ndWxhciBhcHBsaWNhdGlvbnMgb24gdGhlIHBhZ2UuXG4gICAqL1xuICBhYnN0cmFjdCBkaXNwb3NlKCk6IHZvaWQ7XG59XG5cbmV4cG9ydCBjbGFzcyBQbGF0Zm9ybVJlZl8gZXh0ZW5kcyBQbGF0Zm9ybVJlZiB7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX2FwcGxpY2F0aW9uczogQXBwbGljYXRpb25SZWZbXSA9IFtdO1xuICAvKiogQGludGVybmFsICovXG4gIF9kaXNwb3NlTGlzdGVuZXJzOiBGdW5jdGlvbltdID0gW107XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfaW5qZWN0b3I6IEluamVjdG9yLCBwcml2YXRlIF9kaXNwb3NlOiAoKSA9PiB2b2lkKSB7IHN1cGVyKCk7IH1cblxuICByZWdpc3RlckRpc3Bvc2VMaXN0ZW5lcihkaXNwb3NlOiAoKSA9PiB2b2lkKTogdm9pZCB7IHRoaXMuX2Rpc3Bvc2VMaXN0ZW5lcnMucHVzaChkaXNwb3NlKTsgfVxuXG4gIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7IHJldHVybiB0aGlzLl9pbmplY3RvcjsgfVxuXG4gIGFwcGxpY2F0aW9uKHByb3ZpZGVyczogQXJyYXk8VHlwZSB8IFByb3ZpZGVyIHwgYW55W10+KTogQXBwbGljYXRpb25SZWYge1xuICAgIHZhciBhcHAgPSB0aGlzLl9pbml0QXBwKGNyZWF0ZU5nWm9uZSgpLCBwcm92aWRlcnMpO1xuICAgIHJldHVybiBhcHA7XG4gIH1cblxuICBhc3luY0FwcGxpY2F0aW9uKGJpbmRpbmdGbjogKHpvbmU6IE5nWm9uZSkgPT4gUHJvbWlzZTxBcnJheTxUeXBlIHwgUHJvdmlkZXIgfCBhbnlbXT4+LFxuICAgICAgICAgICAgICAgICAgIGFkZGl0aW9uYWxQcm92aWRlcnM/OiBBcnJheTxUeXBlIHwgUHJvdmlkZXIgfCBhbnlbXT4pOiBQcm9taXNlPEFwcGxpY2F0aW9uUmVmPiB7XG4gICAgdmFyIHpvbmUgPSBjcmVhdGVOZ1pvbmUoKTtcbiAgICB2YXIgY29tcGxldGVyID0gUHJvbWlzZVdyYXBwZXIuY29tcGxldGVyKCk7XG4gICAgem9uZS5ydW4oKCkgPT4ge1xuICAgICAgUHJvbWlzZVdyYXBwZXIudGhlbihiaW5kaW5nRm4oem9uZSksIChwcm92aWRlcnM6IEFycmF5PFR5cGUgfCBQcm92aWRlciB8IGFueVtdPikgPT4ge1xuICAgICAgICBpZiAoaXNQcmVzZW50KGFkZGl0aW9uYWxQcm92aWRlcnMpKSB7XG4gICAgICAgICAgcHJvdmlkZXJzID0gTGlzdFdyYXBwZXIuY29uY2F0KHByb3ZpZGVycywgYWRkaXRpb25hbFByb3ZpZGVycyk7XG4gICAgICAgIH1cbiAgICAgICAgY29tcGxldGVyLnJlc29sdmUodGhpcy5faW5pdEFwcCh6b25lLCBwcm92aWRlcnMpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiBjb21wbGV0ZXIucHJvbWlzZTtcbiAgfVxuXG4gIHByaXZhdGUgX2luaXRBcHAoem9uZTogTmdab25lLCBwcm92aWRlcnM6IEFycmF5PFR5cGUgfCBQcm92aWRlciB8IGFueVtdPik6IEFwcGxpY2F0aW9uUmVmIHtcbiAgICB2YXIgaW5qZWN0b3I6IEluamVjdG9yO1xuICAgIHZhciBhcHA6IEFwcGxpY2F0aW9uUmVmO1xuICAgIHpvbmUucnVuKCgpID0+IHtcbiAgICAgIHByb3ZpZGVycyA9IExpc3RXcmFwcGVyLmNvbmNhdChwcm92aWRlcnMsIFtcbiAgICAgICAgcHJvdmlkZShOZ1pvbmUsIHt1c2VWYWx1ZTogem9uZX0pLFxuICAgICAgICBwcm92aWRlKEFwcGxpY2F0aW9uUmVmLCB7dXNlRmFjdG9yeTogKCk6IEFwcGxpY2F0aW9uUmVmID0+IGFwcCwgZGVwczogW119KVxuICAgICAgXSk7XG5cbiAgICAgIHZhciBleGNlcHRpb25IYW5kbGVyO1xuICAgICAgdHJ5IHtcbiAgICAgICAgaW5qZWN0b3IgPSB0aGlzLmluamVjdG9yLnJlc29sdmVBbmRDcmVhdGVDaGlsZChwcm92aWRlcnMpO1xuICAgICAgICBleGNlcHRpb25IYW5kbGVyID0gaW5qZWN0b3IuZ2V0KEV4Y2VwdGlvbkhhbmRsZXIpO1xuICAgICAgICB6b25lLm92ZXJyaWRlT25FcnJvckhhbmRsZXIoKGUsIHMpID0+IGV4Y2VwdGlvbkhhbmRsZXIuY2FsbChlLCBzKSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGlmIChpc1ByZXNlbnQoZXhjZXB0aW9uSGFuZGxlcikpIHtcbiAgICAgICAgICBleGNlcHRpb25IYW5kbGVyLmNhbGwoZSwgZS5zdGFjayk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcHJpbnQoZS50b1N0cmluZygpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIGFwcCA9IG5ldyBBcHBsaWNhdGlvblJlZl8odGhpcywgem9uZSwgaW5qZWN0b3IpO1xuICAgIHRoaXMuX2FwcGxpY2F0aW9ucy5wdXNoKGFwcCk7XG4gICAgX3J1bkFwcEluaXRpYWxpemVycyhpbmplY3Rvcik7XG4gICAgcmV0dXJuIGFwcDtcbiAgfVxuXG4gIGRpc3Bvc2UoKTogdm9pZCB7XG4gICAgTGlzdFdyYXBwZXIuY2xvbmUodGhpcy5fYXBwbGljYXRpb25zKS5mb3JFYWNoKChhcHApID0+IGFwcC5kaXNwb3NlKCkpO1xuICAgIHRoaXMuX2Rpc3Bvc2VMaXN0ZW5lcnMuZm9yRWFjaCgoZGlzcG9zZSkgPT4gZGlzcG9zZSgpKTtcbiAgICB0aGlzLl9kaXNwb3NlKCk7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIF9hcHBsaWNhdGlvbkRpc3Bvc2VkKGFwcDogQXBwbGljYXRpb25SZWYpOiB2b2lkIHsgTGlzdFdyYXBwZXIucmVtb3ZlKHRoaXMuX2FwcGxpY2F0aW9ucywgYXBwKTsgfVxufVxuXG5mdW5jdGlvbiBfcnVuQXBwSW5pdGlhbGl6ZXJzKGluamVjdG9yOiBJbmplY3Rvcik6IHZvaWQge1xuICBsZXQgaW5pdHM6IEZ1bmN0aW9uW10gPSBpbmplY3Rvci5nZXRPcHRpb25hbChBUFBfSU5JVElBTElaRVIpO1xuICBpZiAoaXNQcmVzZW50KGluaXRzKSkgaW5pdHMuZm9yRWFjaChpbml0ID0+IGluaXQoKSk7XG59XG5cbi8qKlxuICogQSByZWZlcmVuY2UgdG8gYW4gQW5ndWxhciBhcHBsaWNhdGlvbiBydW5uaW5nIG9uIGEgcGFnZS5cbiAqXG4gKiBGb3IgbW9yZSBhYm91dCBBbmd1bGFyIGFwcGxpY2F0aW9ucywgc2VlIHRoZSBkb2N1bWVudGF0aW9uIGZvciB7QGxpbmsgYm9vdHN0cmFwfS5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEFwcGxpY2F0aW9uUmVmIHtcbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGEgbGlzdGVuZXIgdG8gYmUgY2FsbGVkIGVhY2ggdGltZSBgYm9vdHN0cmFwKClgIGlzIGNhbGxlZCB0byBib290c3RyYXBcbiAgICogYSBuZXcgcm9vdCBjb21wb25lbnQuXG4gICAqL1xuICBhYnN0cmFjdCByZWdpc3RlckJvb3RzdHJhcExpc3RlbmVyKGxpc3RlbmVyOiAocmVmOiBDb21wb25lbnRSZWYpID0+IHZvaWQpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBSZWdpc3RlciBhIGxpc3RlbmVyIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBhcHBsaWNhdGlvbiBpcyBkaXNwb3NlZC5cbiAgICovXG4gIGFic3RyYWN0IHJlZ2lzdGVyRGlzcG9zZUxpc3RlbmVyKGRpc3Bvc2U6ICgpID0+IHZvaWQpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBCb290c3RyYXAgYSBuZXcgY29tcG9uZW50IGF0IHRoZSByb290IGxldmVsIG9mIHRoZSBhcHBsaWNhdGlvbi5cbiAgICpcbiAgICogIyMjIEJvb3RzdHJhcCBwcm9jZXNzXG4gICAqXG4gICAqIFdoZW4gYm9vdHN0cmFwcGluZyBhIG5ldyByb290IGNvbXBvbmVudCBpbnRvIGFuIGFwcGxpY2F0aW9uLCBBbmd1bGFyIG1vdW50cyB0aGVcbiAgICogc3BlY2lmaWVkIGFwcGxpY2F0aW9uIGNvbXBvbmVudCBvbnRvIERPTSBlbGVtZW50cyBpZGVudGlmaWVkIGJ5IHRoZSBbY29tcG9uZW50VHlwZV0nc1xuICAgKiBzZWxlY3RvciBhbmQga2lja3Mgb2ZmIGF1dG9tYXRpYyBjaGFuZ2UgZGV0ZWN0aW9uIHRvIGZpbmlzaCBpbml0aWFsaXppbmcgdGhlIGNvbXBvbmVudC5cbiAgICpcbiAgICogIyMjIE9wdGlvbmFsIFByb3ZpZGVyc1xuICAgKlxuICAgKiBQcm92aWRlcnMgZm9yIHRoZSBnaXZlbiBjb21wb25lbnQgY2FuIG9wdGlvbmFsbHkgYmUgb3ZlcnJpZGRlbiB2aWEgdGhlIGBwcm92aWRlcnNgXG4gICAqIHBhcmFtZXRlci4gVGhlc2UgcHJvdmlkZXJzIHdpbGwgb25seSBhcHBseSBmb3IgdGhlIHJvb3QgY29tcG9uZW50IGJlaW5nIGFkZGVkIGFuZCBhbnlcbiAgICogY2hpbGQgY29tcG9uZW50cyB1bmRlciBpdC5cbiAgICpcbiAgICogIyMjIEV4YW1wbGVcbiAgICogYGBgXG4gICAqIHZhciBhcHAgPSBwbGF0Zm9ybS5hcHBsaWNhdGlvbihbYXBwUHJvdmlkZXJzXTtcbiAgICogYXBwLmJvb3RzdHJhcChGaXJzdFJvb3RDb21wb25lbnQpO1xuICAgKiBhcHAuYm9vdHN0cmFwKFNlY29uZFJvb3RDb21wb25lbnQsIFtwcm92aWRlKE92ZXJyaWRlQmluZGluZywge3VzZUNsYXNzOiBPdmVycmlkZGVuQmluZGluZ30pXSk7XG4gICAqIGBgYFxuICAgKi9cbiAgYWJzdHJhY3QgYm9vdHN0cmFwKGNvbXBvbmVudFR5cGU6IFR5cGUsXG4gICAgICAgICAgICAgICAgICAgICBwcm92aWRlcnM/OiBBcnJheTxUeXBlIHwgUHJvdmlkZXIgfCBhbnlbXT4pOiBQcm9taXNlPENvbXBvbmVudFJlZj47XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlIHRoZSBhcHBsaWNhdGlvbiB7QGxpbmsgSW5qZWN0b3J9LlxuICAgKi9cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHsgcmV0dXJuIHVuaW1wbGVtZW50ZWQoKTsgfTtcblxuICAvKipcbiAgICogUmV0cmlldmUgdGhlIGFwcGxpY2F0aW9uIHtAbGluayBOZ1pvbmV9LlxuICAgKi9cbiAgZ2V0IHpvbmUoKTogTmdab25lIHsgcmV0dXJuIHVuaW1wbGVtZW50ZWQoKTsgfTtcblxuICAvKipcbiAgICogRGlzcG9zZSBvZiB0aGlzIGFwcGxpY2F0aW9uIGFuZCBhbGwgb2YgaXRzIGNvbXBvbmVudHMuXG4gICAqL1xuICBhYnN0cmFjdCBkaXNwb3NlKCk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIEludm9rZSB0aGlzIG1ldGhvZCB0byBleHBsaWNpdGx5IHByb2Nlc3MgY2hhbmdlIGRldGVjdGlvbiBhbmQgaXRzIHNpZGUtZWZmZWN0cy5cbiAgICpcbiAgICogSW4gZGV2ZWxvcG1lbnQgbW9kZSwgYHRpY2soKWAgYWxzbyBwZXJmb3JtcyBhIHNlY29uZCBjaGFuZ2UgZGV0ZWN0aW9uIGN5Y2xlIHRvIGVuc3VyZSB0aGF0IG5vXG4gICAqIGZ1cnRoZXIgY2hhbmdlcyBhcmUgZGV0ZWN0ZWQuIElmIGFkZGl0aW9uYWwgY2hhbmdlcyBhcmUgcGlja2VkIHVwIGR1cmluZyB0aGlzIHNlY29uZCBjeWNsZSxcbiAgICogYmluZGluZ3MgaW4gdGhlIGFwcCBoYXZlIHNpZGUtZWZmZWN0cyB0aGF0IGNhbm5vdCBiZSByZXNvbHZlZCBpbiBhIHNpbmdsZSBjaGFuZ2UgZGV0ZWN0aW9uXG4gICAqIHBhc3MuXG4gICAqIEluIHRoaXMgY2FzZSwgQW5ndWxhciB0aHJvd3MgYW4gZXJyb3IsIHNpbmNlIGFuIEFuZ3VsYXIgYXBwbGljYXRpb24gY2FuIG9ubHkgaGF2ZSBvbmUgY2hhbmdlXG4gICAqIGRldGVjdGlvbiBwYXNzIGR1cmluZyB3aGljaCBhbGwgY2hhbmdlIGRldGVjdGlvbiBtdXN0IGNvbXBsZXRlLlxuICAgKi9cbiAgYWJzdHJhY3QgdGljaygpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBHZXQgYSBsaXN0IG9mIGNvbXBvbmVudCB0eXBlcyByZWdpc3RlcmVkIHRvIHRoaXMgYXBwbGljYXRpb24uXG4gICAqL1xuICBnZXQgY29tcG9uZW50VHlwZXMoKTogVHlwZVtdIHsgcmV0dXJuIHVuaW1wbGVtZW50ZWQoKTsgfTtcbn1cblxuZXhwb3J0IGNsYXNzIEFwcGxpY2F0aW9uUmVmXyBleHRlbmRzIEFwcGxpY2F0aW9uUmVmIHtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBzdGF0aWMgX3RpY2tTY29wZTogV3RmU2NvcGVGbiA9IHd0ZkNyZWF0ZVNjb3BlKCdBcHBsaWNhdGlvblJlZiN0aWNrKCknKTtcblxuICAvKiogQGludGVybmFsICovXG4gIHByaXZhdGUgX2Jvb3RzdHJhcExpc3RlbmVyczogRnVuY3Rpb25bXSA9IFtdO1xuICAvKiogQGludGVybmFsICovXG4gIHByaXZhdGUgX2Rpc3Bvc2VMaXN0ZW5lcnM6IEZ1bmN0aW9uW10gPSBbXTtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBwcml2YXRlIF9yb290Q29tcG9uZW50czogQ29tcG9uZW50UmVmW10gPSBbXTtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBwcml2YXRlIF9yb290Q29tcG9uZW50VHlwZXM6IFR5cGVbXSA9IFtdO1xuICAvKiogQGludGVybmFsICovXG4gIHByaXZhdGUgX2NoYW5nZURldGVjdG9yUmVmczogQ2hhbmdlRGV0ZWN0b3JSZWZbXSA9IFtdO1xuICAvKiogQGludGVybmFsICovXG4gIHByaXZhdGUgX3J1bm5pbmdUaWNrOiBib29sZWFuID0gZmFsc2U7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgcHJpdmF0ZSBfZW5mb3JjZU5vTmV3Q2hhbmdlczogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX3BsYXRmb3JtOiBQbGF0Zm9ybVJlZl8sIHByaXZhdGUgX3pvbmU6IE5nWm9uZSwgcHJpdmF0ZSBfaW5qZWN0b3I6IEluamVjdG9yKSB7XG4gICAgc3VwZXIoKTtcbiAgICBpZiAoaXNQcmVzZW50KHRoaXMuX3pvbmUpKSB7XG4gICAgICBPYnNlcnZhYmxlV3JhcHBlci5zdWJzY3JpYmUodGhpcy5fem9uZS5vblR1cm5Eb25lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChfKSA9PiB7IHRoaXMuX3pvbmUucnVuKCgpID0+IHsgdGhpcy50aWNrKCk7IH0pOyB9KTtcbiAgICB9XG4gICAgdGhpcy5fZW5mb3JjZU5vTmV3Q2hhbmdlcyA9IGFzc2VydGlvbnNFbmFibGVkKCk7XG4gIH1cblxuICByZWdpc3RlckJvb3RzdHJhcExpc3RlbmVyKGxpc3RlbmVyOiAocmVmOiBDb21wb25lbnRSZWYpID0+IHZvaWQpOiB2b2lkIHtcbiAgICB0aGlzLl9ib290c3RyYXBMaXN0ZW5lcnMucHVzaChsaXN0ZW5lcik7XG4gIH1cblxuICByZWdpc3RlckRpc3Bvc2VMaXN0ZW5lcihkaXNwb3NlOiAoKSA9PiB2b2lkKTogdm9pZCB7IHRoaXMuX2Rpc3Bvc2VMaXN0ZW5lcnMucHVzaChkaXNwb3NlKTsgfVxuXG4gIHJlZ2lzdGVyQ2hhbmdlRGV0ZWN0b3IoY2hhbmdlRGV0ZWN0b3I6IENoYW5nZURldGVjdG9yUmVmKTogdm9pZCB7XG4gICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWZzLnB1c2goY2hhbmdlRGV0ZWN0b3IpO1xuICB9XG5cbiAgdW5yZWdpc3RlckNoYW5nZURldGVjdG9yKGNoYW5nZURldGVjdG9yOiBDaGFuZ2VEZXRlY3RvclJlZik6IHZvaWQge1xuICAgIExpc3RXcmFwcGVyLnJlbW92ZSh0aGlzLl9jaGFuZ2VEZXRlY3RvclJlZnMsIGNoYW5nZURldGVjdG9yKTtcbiAgfVxuXG4gIGJvb3RzdHJhcChjb21wb25lbnRUeXBlOiBUeXBlLFxuICAgICAgICAgICAgcHJvdmlkZXJzPzogQXJyYXk8VHlwZSB8IFByb3ZpZGVyIHwgYW55W10+KTogUHJvbWlzZTxDb21wb25lbnRSZWY+IHtcbiAgICB2YXIgY29tcGxldGVyID0gUHJvbWlzZVdyYXBwZXIuY29tcGxldGVyKCk7XG4gICAgdGhpcy5fem9uZS5ydW4oKCkgPT4ge1xuICAgICAgdmFyIGNvbXBvbmVudFByb3ZpZGVycyA9IF9jb21wb25lbnRQcm92aWRlcnMoY29tcG9uZW50VHlwZSk7XG4gICAgICBpZiAoaXNQcmVzZW50KHByb3ZpZGVycykpIHtcbiAgICAgICAgY29tcG9uZW50UHJvdmlkZXJzLnB1c2gocHJvdmlkZXJzKTtcbiAgICAgIH1cbiAgICAgIHZhciBleGNlcHRpb25IYW5kbGVyID0gdGhpcy5faW5qZWN0b3IuZ2V0KEV4Y2VwdGlvbkhhbmRsZXIpO1xuICAgICAgdGhpcy5fcm9vdENvbXBvbmVudFR5cGVzLnB1c2goY29tcG9uZW50VHlwZSk7XG4gICAgICB0cnkge1xuICAgICAgICB2YXIgaW5qZWN0b3I6IEluamVjdG9yID0gdGhpcy5faW5qZWN0b3IucmVzb2x2ZUFuZENyZWF0ZUNoaWxkKGNvbXBvbmVudFByb3ZpZGVycyk7XG4gICAgICAgIHZhciBjb21wUmVmVG9rZW46IFByb21pc2U8Q29tcG9uZW50UmVmPiA9IGluamVjdG9yLmdldChBUFBfQ09NUE9ORU5UX1JFRl9QUk9NSVNFKTtcbiAgICAgICAgdmFyIHRpY2sgPSAoY29tcG9uZW50UmVmKSA9PiB7XG4gICAgICAgICAgdGhpcy5fbG9hZENvbXBvbmVudChjb21wb25lbnRSZWYpO1xuICAgICAgICAgIGNvbXBsZXRlci5yZXNvbHZlKGNvbXBvbmVudFJlZik7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHRpY2tSZXN1bHQgPSBQcm9taXNlV3JhcHBlci50aGVuKGNvbXBSZWZUb2tlbiwgdGljayk7XG5cbiAgICAgICAgLy8gVEhJUyBNVVNUIE9OTFkgUlVOIElOIERBUlQuXG4gICAgICAgIC8vIFRoaXMgaXMgcmVxdWlyZWQgdG8gcmVwb3J0IGFuIGVycm9yIHdoZW4gbm8gY29tcG9uZW50cyB3aXRoIGEgbWF0Y2hpbmcgc2VsZWN0b3IgZm91bmQuXG4gICAgICAgIC8vIE90aGVyd2lzZSB0aGUgcHJvbWlzZSB3aWxsIG5ldmVyIGJlIGNvbXBsZXRlZC5cbiAgICAgICAgLy8gRG9pbmcgdGhpcyBpbiBKUyBjYXVzZXMgYW4gZXh0cmEgZXJyb3IgbWVzc2FnZSB0byBhcHBlYXIuXG4gICAgICAgIGlmIChJU19EQVJUKSB7XG4gICAgICAgICAgUHJvbWlzZVdyYXBwZXIudGhlbih0aWNrUmVzdWx0LCAoXykgPT4ge30pO1xuICAgICAgICB9XG5cbiAgICAgICAgUHJvbWlzZVdyYXBwZXIudGhlbih0aWNrUmVzdWx0LCBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChlcnIsIHN0YWNrVHJhY2UpID0+IGNvbXBsZXRlci5yZWplY3QoZXJyLCBzdGFja1RyYWNlKSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGV4Y2VwdGlvbkhhbmRsZXIuY2FsbChlLCBlLnN0YWNrKTtcbiAgICAgICAgY29tcGxldGVyLnJlamVjdChlLCBlLnN0YWNrKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gY29tcGxldGVyLnByb21pc2U7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIF9sb2FkQ29tcG9uZW50KHJlZik6IHZvaWQge1xuICAgIHZhciBhcHBDaGFuZ2VEZXRlY3RvciA9IGludGVybmFsVmlldyhyZWYuaG9zdFZpZXcpLmNoYW5nZURldGVjdG9yO1xuICAgIHRoaXMuX2NoYW5nZURldGVjdG9yUmVmcy5wdXNoKGFwcENoYW5nZURldGVjdG9yLnJlZik7XG4gICAgdGhpcy50aWNrKCk7XG4gICAgdGhpcy5fcm9vdENvbXBvbmVudHMucHVzaChyZWYpO1xuICAgIHRoaXMuX2Jvb3RzdHJhcExpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcikgPT4gbGlzdGVuZXIocmVmKSk7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIF91bmxvYWRDb21wb25lbnQocmVmKTogdm9pZCB7XG4gICAgaWYgKCFMaXN0V3JhcHBlci5jb250YWlucyh0aGlzLl9yb290Q29tcG9uZW50cywgcmVmKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnVucmVnaXN0ZXJDaGFuZ2VEZXRlY3RvcihpbnRlcm5hbFZpZXcocmVmLmhvc3RWaWV3KS5jaGFuZ2VEZXRlY3Rvci5yZWYpO1xuICAgIExpc3RXcmFwcGVyLnJlbW92ZSh0aGlzLl9yb290Q29tcG9uZW50cywgcmVmKTtcbiAgfVxuXG4gIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7IHJldHVybiB0aGlzLl9pbmplY3RvcjsgfVxuXG4gIGdldCB6b25lKCk6IE5nWm9uZSB7IHJldHVybiB0aGlzLl96b25lOyB9XG5cbiAgdGljaygpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fcnVubmluZ1RpY2spIHtcbiAgICAgIHRocm93IG5ldyBCYXNlRXhjZXB0aW9uKFwiQXBwbGljYXRpb25SZWYudGljayBpcyBjYWxsZWQgcmVjdXJzaXZlbHlcIik7XG4gICAgfVxuXG4gICAgdmFyIHMgPSBBcHBsaWNhdGlvblJlZl8uX3RpY2tTY29wZSgpO1xuICAgIHRyeSB7XG4gICAgICB0aGlzLl9ydW5uaW5nVGljayA9IHRydWU7XG4gICAgICB0aGlzLl9jaGFuZ2VEZXRlY3RvclJlZnMuZm9yRWFjaCgoZGV0ZWN0b3IpID0+IGRldGVjdG9yLmRldGVjdENoYW5nZXMoKSk7XG4gICAgICBpZiAodGhpcy5fZW5mb3JjZU5vTmV3Q2hhbmdlcykge1xuICAgICAgICB0aGlzLl9jaGFuZ2VEZXRlY3RvclJlZnMuZm9yRWFjaCgoZGV0ZWN0b3IpID0+IGRldGVjdG9yLmNoZWNrTm9DaGFuZ2VzKCkpO1xuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLl9ydW5uaW5nVGljayA9IGZhbHNlO1xuICAgICAgd3RmTGVhdmUocyk7XG4gICAgfVxuICB9XG5cbiAgZGlzcG9zZSgpOiB2b2lkIHtcbiAgICAvLyBUT0RPKGFseGh1Yik6IERpc3Bvc2Ugb2YgdGhlIE5nWm9uZS5cbiAgICBMaXN0V3JhcHBlci5jbG9uZSh0aGlzLl9yb290Q29tcG9uZW50cykuZm9yRWFjaCgocmVmKSA9PiByZWYuZGlzcG9zZSgpKTtcbiAgICB0aGlzLl9kaXNwb3NlTGlzdGVuZXJzLmZvckVhY2goKGRpc3Bvc2UpID0+IGRpc3Bvc2UoKSk7XG4gICAgdGhpcy5fcGxhdGZvcm0uX2FwcGxpY2F0aW9uRGlzcG9zZWQodGhpcyk7XG4gIH1cblxuICBnZXQgY29tcG9uZW50VHlwZXMoKTogYW55W10geyByZXR1cm4gdGhpcy5fcm9vdENvbXBvbmVudFR5cGVzOyB9XG59XG4iXX0=