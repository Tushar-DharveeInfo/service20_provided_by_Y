
import './SplashLoader.css';
import { ISplashLoader } from './IAuthorization';

interface WelcomeProps {
    name?: string;
}

const Welcome = ({ name = 'Guest' }: WelcomeProps) => {
    return (
        <div style={{
            textAlign: 'center' as const,
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            minHeight: '60px',
            height: '60px'
        }}>
            <span style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#667eea',
                letterSpacing: '1px',
                whiteSpace: 'nowrap' as const,
                lineHeight: '1.2'
            }}>
                Hello, {name}
            </span>
            <span style={{
                fontSize: '0.75rem',
                fontWeight: 400,
                color: '#764ba2',
                lineHeight: '1.2'
            }}>
                Loading ...
            </span>
        </div>
    );
};

const SplashLoader = ({
    allowSplashScreen,
    message,
    currentStage,
    loadingMessage,
}: ISplashLoader) => {


    const isVisible = currentStage !== 1;

    return (
        <div
            className={`nz-centered-page ${isVisible ? 'nz-splash-visible' : 'nz-splash-hidden'}`}
            aria-hidden={!isVisible}
        >
            <div className="nz-logo-container">
                <div className="nz-loader-below">

                    {allowSplashScreen ? (
                        <div className="nz-loader-content">
                            <Welcome name={loadingMessage} />
                        </div>
                    ) : <></>}
                </div>
            </div>

            {message && (
                <div className="nz-bottom-message">
                    {message}
                </div>
            )}
        </div>
    );
};

export { SplashLoader };
