import { DiagramWizard } from './components/DiagramWizard';
import { HydrationWrapper } from './components/HydrationWrapper';

export default function Page() {
  return (
    <HydrationWrapper>
      <DiagramWizard />
    </HydrationWrapper>
  );
}
