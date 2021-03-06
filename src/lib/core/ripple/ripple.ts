/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Platform} from '@angular/cdk/platform';
import {
  Directive,
  ElementRef,
  Inject,
  InjectionToken,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Optional,
} from '@angular/core';
import {RippleRef} from './ripple-ref';
import {RippleAnimationConfig, RippleConfig, RippleRenderer, RippleTarget} from './ripple-renderer';

/** Configurable options for `matRipple`. */
export interface RippleGlobalOptions {
  /**
   * Whether ripples should be disabled. Ripples can be still launched manually by using
   * the `launch()` method. Therefore focus indicators will still show up.
   */
  disabled?: boolean;

  /**
   * Configuration for the animation duration of the ripples.
   * There are two phases with different durations for the ripples.
   */
  animation?: RippleAnimationConfig;

  /**
   * If set, the default duration of the fade-in animation is divided by this value. For example,
   * setting it to 0.5 will cause the ripple fade-in animation to take twice as long.
   * A changed speedFactor will not affect the fade-out duration of the ripples.
   * @deprecated Use the `animation` global option instead.
   */
  baseSpeedFactor?: number;

  /**
   * Whether ripples should start fading out immediately after the mouse our touch is released. By
   * default, ripples will wait for the enter animation to complete and for mouse or touch release.
   */
  terminateOnPointerUp?: boolean;
}

/** Injection token that can be used to specify the global ripple options. */
export const MAT_RIPPLE_GLOBAL_OPTIONS =
    new InjectionToken<RippleGlobalOptions>('mat-ripple-global-options');

@Directive({
  selector: '[mat-ripple], [matRipple]',
  exportAs: 'matRipple',
  host: {
    'class': 'mat-ripple',
    '[class.mat-ripple-unbounded]': 'unbounded'
  }
})
export class MatRipple implements OnInit, OnDestroy, RippleTarget {

  /** Custom color for all ripples. */
  @Input('matRippleColor') color: string;

  /** Whether the ripples should be visible outside the component's bounds. */
  @Input('matRippleUnbounded') unbounded: boolean;

  /**
   * Whether the ripple always originates from the center of the host element's bounds, rather
   * than originating from the location of the click event.
   */
  @Input('matRippleCentered') centered: boolean;

  /**
   * If set, the radius in pixels of foreground ripples when fully expanded. If unset, the radius
   * will be the distance from the center of the ripple to the furthest corner of the host element's
   * bounding rectangle.
   */
  @Input('matRippleRadius') radius: number = 0;

  /**
   * If set, the normal duration of ripple animations is divided by this value. For example,
   * setting it to 0.5 will cause the animations to take twice as long.
   * A changed speedFactor will not modify the fade-out duration of the ripples.
   * @deprecated Use the [matRippleAnimation] binding instead.
   */
  @Input('matRippleSpeedFactor') speedFactor: number = 1;

  /**
   * Configuration for the ripple animation. Allows modifying the enter and exit animation
   * duration of the ripples.
   */
  @Input('matRippleAnimation') animation: RippleAnimationConfig;

  /**
   * Whether click events will not trigger the ripple. Ripples can be still launched manually
   * by using the `launch()` method.
   */
  @Input('matRippleDisabled')
  get disabled() { return this._disabled; }
  set disabled(value: boolean) {
    this._disabled = value;
    this._setupTriggerEventsIfEnabled();
  }
  private _disabled: boolean = false;

  /**
   * The element that triggers the ripple when click events are received.
   * Defaults to the directive's host element.
   */
  @Input('matRippleTrigger')
  get trigger() { return this._trigger || this._elementRef.nativeElement; }
  set trigger(trigger: HTMLElement) {
    this._trigger = trigger;
    this._setupTriggerEventsIfEnabled();
  }
  private _trigger: HTMLElement;

  /** Renderer for the ripple DOM manipulations. */
  private _rippleRenderer: RippleRenderer;

  /** Options that are set globally for all ripples. */
  private _globalOptions: RippleGlobalOptions;

  /** Whether ripple directive is initialized and the input bindings are set. */
  private _isInitialized: boolean = false;

  constructor(private _elementRef: ElementRef,
              ngZone: NgZone,
              platform: Platform,
              @Optional() @Inject(MAT_RIPPLE_GLOBAL_OPTIONS) globalOptions: RippleGlobalOptions) {

    this._globalOptions = globalOptions || {};
    this._rippleRenderer = new RippleRenderer(this, ngZone, _elementRef, platform);
  }

  ngOnInit() {
    this._isInitialized = true;
    this._setupTriggerEventsIfEnabled();
  }

  ngOnDestroy() {
    this._rippleRenderer._removeTriggerEvents();
  }

  /** Launches a manual ripple at the specified position. */
  launch(x: number, y: number, config?: RippleConfig): RippleRef {
    return this._rippleRenderer.fadeInRipple(x, y, {...this.rippleConfig, ...config});
  }

  /** Fades out all currently showing ripple elements. */
  fadeOutAll() {
    this._rippleRenderer.fadeOutAll();
  }

  /** Ripple configuration from the directive's input values. */
  get rippleConfig(): RippleConfig {
    return {
      centered: this.centered,
      radius: this.radius,
      color: this.color,
      animation: {...this._globalOptions.animation, ...this.animation},
      terminateOnPointerUp: this._globalOptions.terminateOnPointerUp,
      speedFactor: this.speedFactor * (this._globalOptions.baseSpeedFactor || 1),
    };
  }

  /** Whether ripples on pointer-down are disabled or not. */
  get rippleDisabled(): boolean {
    return this.disabled || !!this._globalOptions.disabled;
  }

  /** Sets up the the trigger event listeners if ripples are enabled. */
  private _setupTriggerEventsIfEnabled() {
    if (!this.disabled && this._isInitialized) {
      this._rippleRenderer.setupTriggerEvents(this.trigger);
    }
  }
}

