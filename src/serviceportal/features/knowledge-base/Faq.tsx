
import ErrorBoundary from '../../shared/errorboundary/ErrorBoundary.tsx'
import { RenderPdf } from '../../shared/help/RenderPdf.tsx';

const Faq = () => {

  return (
    <div>
      FAQ Page
      <ErrorBoundary>
        <RenderPdf bucketName="n20-bucket-01" baseFolder="sm" fileName="/help/help-faq-service.pdf" />
      </ErrorBoundary>

    </div>
  );
};

export { Faq };
export default Faq;
