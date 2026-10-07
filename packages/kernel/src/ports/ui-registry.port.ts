/**
 * What a module's ui/register.ts receives. Implemented by the web app's shell.
 * Components are typed loosely here so the kernel never depends on React.
 */
export interface ShellRegistryPort {
  addRoute(r: { path: string; component: unknown }): void;
  addMenuItem(m: { label: string; path: string; permission?: string }): void;
  addWidget(w: { slot: string; component: unknown }): void;
}

export type ModuleUiRegister = (shell: ShellRegistryPort) => void;
