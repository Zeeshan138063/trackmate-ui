import { MasterProfile } from "@/types/resume";
import { cn } from "@/lib/utils";
import { MapPin, Phone, Mail, Globe, Github, Linkedin, Award } from "lucide-react";

interface EuropassTemplateProps {
    data: MasterProfile;
    className?: string;
}

export function EuropassTemplate({ data, className }: EuropassTemplateProps) {
    if (!data) return null;

    return (
        <div className={cn("bg-white text-black max-w-[8.5in] mx-auto min-h-[11in] text-sm font-sans flex shadow-lg print:shadow-none print:w-full print:max-w-none border dark:border-slate-800", className)} id="resume-preview">

            {/* Left Sidebar - Personal Info & Skills */}
            <aside className="w-[32%] bg-slate-100/50 border-r border-slate-200 p-6 flex flex-col gap-6 print:bg-slate-100">

                {/* Photo Placeholder (Europass often has one) */}
                <div className="w-full aspect-square bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 mb-2">
                    <span className="text-xs">Photo</span>
                </div>

                {/* Contact */}
                <div className="space-y-3 text-xs">
                    <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-2 border-b border-slate-300 pb-1">Contact</h3>

                    {data.contact.location && (
                        <div className="flex items-start gap-2 break-all">
                            <MapPin className="w-3 h-3 mt-0.5 text-blue-600 shrink-0" />
                            <span>{data.contact.location}</span>
                        </div>
                    )}
                    {data.contact.phone && (
                        <div className="flex items-start gap-2 break-all">
                            <Phone className="w-3 h-3 mt-0.5 text-blue-600 shrink-0" />
                            <span>{data.contact.phone}</span>
                        </div>
                    )}
                    {data.contact.email && (
                        <div className="flex items-start gap-2 break-all">
                            <Mail className="w-3 h-3 mt-0.5 text-blue-600 shrink-0" />
                            <span>{data.contact.email}</span>
                        </div>
                    )}
                    {data.contact.linkedin && (
                        <div className="flex items-start gap-2 break-all">
                            <Linkedin className="w-3 h-3 mt-0.5 text-blue-600 shrink-0" />
                            <a href={data.contact.linkedin} target="_blank" rel="noreferrer" className="hover:underline">LinkedIn</a>
                        </div>
                    )}
                    {data.contact.github && (
                        <div className="flex items-start gap-2 break-all">
                            <Github className="w-3 h-3 mt-0.5 text-blue-600 shrink-0" />
                            <a href={data.contact.github} target="_blank" rel="noreferrer" className="hover:underline">GitHub</a>
                        </div>
                    )}
                    {data.contact.portfolio && (
                        <div className="flex items-start gap-2 break-all">
                            <Globe className="w-3 h-3 mt-0.5 text-blue-600 shrink-0" />
                            <a href={data.contact.portfolio} target="_blank" rel="noreferrer" className="hover:underline">Portfolio</a>
                        </div>
                    )}
                </div>

                {/* Skills - Left Column in Europass often */}
                {data.skills.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-2 border-b border-slate-300 pb-1">Skills</h3>
                        {data.skills.map((skill, i) => (
                            <div key={i} className="mb-2">
                                <div className="font-semibold text-xs text-blue-900 mb-0.5">{skill.category}</div>
                                <div className="text-xs text-slate-600 leading-snug">{skill.items}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Languages placeholder - Europass specific, we map from skills for now or assume user adds them */}
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 space-y-6">

                {/* Header */}
                <header className="border-b-2 border-blue-600 pb-4 mb-6">
                    <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight uppercase">
                        {data.contact.firstName} <span className="text-blue-600">{data.contact.lastName}</span>
                    </h1>
                    {data.targetTitle && (
                        <div className="text-lg font-medium text-slate-600 mt-1">{data.targetTitle}</div>
                    )}
                </header>

                {/* Summary */}
                {data.summary && (
                    <section>
                        <h2 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-600"></div> Profile
                        </h2>
                        <p className="text-slate-700 leading-relaxed text-sm text-justify">
                            {data.summary}
                        </p>
                    </section>
                )}

                {/* Work Experience */}
                {data.experience.length > 0 && (
                    <section>
                        <h2 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-200 pb-2 mt-2">
                            <div className="w-1.5 h-1.5 bg-blue-600"></div> Work Experience
                        </h2>

                        <div className="space-y-5 border-l-2 border-slate-200 ml-1 pl-5 relative">
                            {data.experience.map((exp, i) => (
                                <div key={i} className="relative group">
                                    {/* Timeline dot */}
                                    <div className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-white border-2 border-blue-400 group-hover:bg-blue-600 transition-colors"></div>

                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="font-bold text-slate-900">{exp.position}</h3>
                                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{exp.startDate} — {exp.endDate || "Present"}</span>
                                    </div>
                                    <div className="text-sm text-slate-600 font-medium mb-2">{exp.company} | {exp.location}</div>

                                    <div className="text-sm text-slate-700 space-y-1">
                                        {exp.description.split('\n').map((line, idx) => {
                                            const trimmed = line.trim();
                                            if (!trimmed) return null;
                                            return <div key={idx} className="flex gap-2"><span className="text-blue-400">•</span><span className="flex-1">{trimmed.replace(/^[-•]\s*/, '')}</span></div>
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Education */}
                {data.education.length > 0 && (
                    <section>
                        <h2 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-200 pb-2 mt-4">
                            <div className="w-1.5 h-1.5 bg-blue-600"></div> Education
                        </h2>
                        <div className="space-y-4">
                            {data.education.map((edu, i) => (
                                <div key={i}>
                                    <div className="flex justify-between font-bold text-slate-900">
                                        <span>{edu.school}</span>
                                        <span className="text-xs font-medium text-slate-500">{edu.startDate} - {edu.endDate}</span>
                                    </div>
                                    <div className="text-sm text-slate-600 italic">{edu.degree}{edu.field ? `, ${edu.field}` : ''}</div>
                                    <div className="text-xs text-slate-500">{edu.location}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Certifications & Publications Combined for compactness if needed, or separate */}
                {(data.certifications.length > 0 || data.awards.length > 0 || data.publications.length > 0) && (
                    <section>
                        <h2 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-slate-200 pb-2 mt-4">
                            <div className="w-1.5 h-1.5 bg-blue-600"></div> Additional Information
                        </h2>

                        {data.certifications.length > 0 && (
                            <div className="mb-3">
                                <h4 className="text-xs font-bold text-slate-700 uppercase mb-1">Certifications</h4>
                                <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                                    {data.certifications.map((cert, i) => (
                                        <li key={i}><span className="font-semibold">{cert.name}</span> <span className="text-slate-400">|</span> {cert.issuer}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {data.publications.length > 0 && (
                            <div className="mb-3">
                                <h4 className="text-xs font-bold text-slate-700 uppercase mb-1">Publications</h4>
                                <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                                    {data.publications.map((pub, i) => (
                                        <li key={i}><span className="font-semibold">{pub.title}</span> <span className="text-slate-400">|</span> {pub.publisher}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </section>
                )}

            </main>
        </div>
    );
}
