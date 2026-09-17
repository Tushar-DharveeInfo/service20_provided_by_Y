
import ErrorBoundary from '../../shared/errorboundary/ErrorBoundary.tsx'
import { RenderPdfWithoutToc } from '../../shared/help/RenderPdfWithoutToc.tsx';

const About = () => {

  return (
    <div>
      <ErrorBoundary>
        <RenderPdfWithoutToc bucketName="n20-bucket-01" baseFolder="sm" fileName="/help/about-netzoom.pdf" />
      </ErrorBoundary>

    </div>
  );
};

export { About };
export default About;
