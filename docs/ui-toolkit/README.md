# Keystone UI Toolkit

Complete design system and component library for the Keystone.

## Quick Start
```tsx
// Import components
import { Container, Section, Header } from '@/components';
import { StatCard, Badge } from '@/components';
import { Modal, Alert } from '@/components';

// Use in your pages
<Header sticky />
<Section variant="gradient">
  <Container>
    <StatCard icon={Calendar} label="Duration" value="6 months" />
  </Container>
</Section>