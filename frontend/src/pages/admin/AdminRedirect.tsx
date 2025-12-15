import { useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';

// admin redirect component
const AdminRedirect = () => {
  const { t } = useLanguage();
    // redirect to backend admin on component mount
    useEffect(() => {
        // backend api url from .env or hardcoded - same as in apiClient.ts
        const backendUrl = "/";
        
        // construct admin url
        const adminUrl = `${backendUrl}/admin/`;
        
        // redirect to backend admin
        window.location.href = adminUrl;
    }, []);

    // show loading message while redirecting
    return (
        <div className="py-12">
            <div className="nh-container">
                <div className="text-center my-12">
                    <p className="text-lg">{t('admin.redirectingToAdmin')}</p>
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mt-4"></div>
                </div>
            </div>
        </div>
    );
};

export default AdminRedirect; 