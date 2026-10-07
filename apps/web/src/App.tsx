import { AppShell, MantineProvider, NavLink, Title } from '@mantine/core';
import '@mantine/core/styles.css';
import { ShellRegistry } from './shell/registry';
import { enabledModules } from './modules';

const registry = new ShellRegistry();
enabledModules.forEach((register) => register(registry));

export function App() {
  return (
    <MantineProvider>
      <AppShell navbar={{ width: 240, breakpoint: 'sm' }} padding="md">
        <AppShell.Navbar p="sm">
          {registry.menu.map((m) => (
            <NavLink key={m.path} href={m.path} label={m.label} />
          ))}
        </AppShell.Navbar>
        <AppShell.Main>
          <Title order={3}>Platform</Title>
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
}
