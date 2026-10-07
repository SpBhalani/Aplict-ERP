import type { ComponentType, LazyExoticComponent } from 'react';

type AnyComponent = ComponentType<Record<string, unknown>> | LazyExoticComponent<ComponentType<Record<string, unknown>>>;

export interface RouteEntry { path: string; component: AnyComponent }
export interface MenuEntry { label: string; path: string; permission?: string }
export interface WidgetEntry { slot: string; component: AnyComponent }

/** Each module's ui/register.ts receives this and adds its routes, menu items and widgets. */
export class ShellRegistry {
  readonly routes: RouteEntry[] = [];
  readonly menu: MenuEntry[] = [];
  private readonly widgets: WidgetEntry[] = [];

  addRoute(r: RouteEntry): void {
    if (this.routes.some((x) => x.path === r.path)) throw new Error(`Route ${r.path} registered twice`);
    this.routes.push(r);
  }
  addMenuItem(m: MenuEntry): void {
    this.menu.push(m);
  }
  addWidget(w: WidgetEntry): void {
    this.widgets.push(w);
  }
  widgetsFor(slot: string): WidgetEntry[] {
    return this.widgets.filter((w) => w.slot === slot);
  }
}

export type ModuleRegister = (shell: ShellRegistry) => void;
