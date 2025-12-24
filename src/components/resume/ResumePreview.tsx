import { useEffect } from "react";
import { MasterProfile, ResumeConfig, initialResumeConfig } from "@/types/resume";
import { ATSTemplate } from "./templates/ATSTemplate";

interface ResumePreviewProps {
    data: MasterProfile;
    config?: ResumeConfig;
    className?: string; // For wrapper styling
}

export function ResumePreview({ data, config = initialResumeConfig, className }: ResumePreviewProps) {
    if (!data) return null;

    useEffect(() => {
        if (data) {
            const title = data.targetTitle
                ? `${data.contact.firstName} ${data.contact.lastName} - ${data.targetTitle}`
                : `${data.contact.firstName} ${data.contact.lastName} Resume`;
            document.title = title;
        }
        return () => {
            document.title = "Trackmate UI"; // Reset on unmount
        };
    }, [data]);

    // Template Selector
    const renderTemplate = () => {
        switch (config.templateId) {
            case 'ats':
                return <ATSTemplate data={data} className={className} />;
            // Future templates will go here:
            // case 'europass': return <EuropassTemplate ... />
            // case 'modern': return <ModernTemplate ... />
            default:
                return <ATSTemplate data={data} className={className} />;
        }
    }

    return renderTemplate();
}
