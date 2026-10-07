import type { ComponentType, LazyExoticComponent } from 'react';
import type { ShellRegistryPort } from '@platform/kernel';

type AnyComponent =
  | ComponentType<Record<string, unknown>>
  | LazyExoticComponent<ComponentType<Record<string, unknown>>>;

export interface RouteEntry {
  path: string;
  component: AnyComponent;
}
export interface MenuEntry {
  label: string;
  path: string;
  permission?: string;
}
export interface WidgetEntry {
  slot: string;
  component: AnyComponent;
}

/** Each module's ui/register.ts receives this and adds its routes, menu items and widgets. */
export class ShellRegistry implements ShellRegistryPort {
  readonly routes: RouteEntry[] = [];
  readonly menu: MenuEntry[] = [];
  private readonly widgets: WidgetEntry[] = [];

  addRoute(r: { path: string; component: unknown }): void {
    if (this.routes.some((x) => x.path === r.path))
      throw new Error(`Route ${r.path} registered twice`);
    this.routes.push({ path: r.path, component: r.component as AnyComponent });
  }
  addMenuItem(m: MenuEntry): void {
    this.menu.push(m);
  }
  addWidget(w: { slot: string; component: unknown }): void {
    this.widgets.push({ slot: w.slot, component: w.component as AnyComponent });
  }
  widgetsFor(slot: string): WidgetEntry[] {
    return this.widgets.filter((w) => w.slot === slot);
  }
}

export type { ModuleUiRegister as ModuleRegister } from '@platform/kernel';
