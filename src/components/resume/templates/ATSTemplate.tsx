import { MasterProfile } from "@/types/resume";
import { cn } from "@/lib/utils";

interface ATSTemplateProps {
    data: MasterProfile;
    className?: string; // For wrapper styling
}

export function ATSTemplate({ data, className }: ATSTemplateProps) {
    if (!data) return null;

    return (
        <div className={cn("bg-white text-black p-[0.5in] shadow-lg max-w-[8.5in] mx-auto min-h-[11in] text-[10.5pt] font-serif leading-normal print:shadow-none print:p-0 print:max-w-none border print:border-none dark:border-slate-800", className)} id="resume-preview">

            {/* Header */}
            <header className="text-center mb-4 border-b pb-4">
                <h1 className="text-3xl font-bold uppercase tracking-wide mb-1 text-gray-900">
                    {data.contact.firstName} {data.contact.lastName}
                </h1>

                <div className="flex flex-wrap justify-center gap-x-3 text-sm text-gray-700">
                    {data.contact.location && <span>{data.contact.location}</span>}
                    {data.contact.phone && <span>| {data.contact.phone}</span>}
                    {data.contact.email && <span>| {data.contact.email}</span>}
                    {data.contact.linkedin && <span>| <a href={data.contact.linkedin} target="_blank" rel="noreferrer" className="hover:underline text-primary">LinkedIn</a></span>}
                    {data.contact.github && <span>| <a href={data.contact.github} target="_blank" rel="noreferrer" className="hover:underline text-primary">GitHub</a></span>}
                    {data.contact.portfolio && <span>| <a href={data.contact.portfolio} target="_blank" rel="noreferrer" className="hover:underline text-primary">Portfolio</a></span>}
                </div>
            </header>

            {/* Professional Summary */}
            {data.summary && (
                <section className="mb-4">
                    <h2 className="text-sm font-bold uppercase border-b border-black mb-2">Professional Summary</h2>
                    <p className="text-justify">{data.summary}</p>
                </section>
            )}

            {/* Technical Skills */}
            {(data.skills.length > 0 || data.interests) && (
                <section className="mb-4">
                    <h2 className="text-sm font-bold uppercase border-b border-black mb-2">Technical Skills</h2>
                    <ul className="list-disc list-outside ml-4 space-y-1">
                        {data.skills.map((skill, i) => (
                            <li key={i}>
                                <span className="font-bold">{skill.category}:</span> {skill.items}
                            </li>
                        ))}
                        {data.interests && (
                            <li><span className="font-bold">Interests:</span> {data.interests}</li>
                        )}
                    </ul>
                </section>
            )}

            {/* Experience */}
            {data.experience.length > 0 && (
                <section className="mb-4">
                    <h2 className="text-sm font-bold uppercase border-b border-black mb-2">Experience</h2>
                    {data.experience.map((exp, i) => (
                        <div key={i} className="mb-3 print-break-avoid">
                            <div className="flex justify-between font-bold">
                                <span>{exp.company}</span>
                                <span>{exp.location}</span>
                            </div>
                            <div className="flex justify-between mb-1">
                                <span className="italic">{exp.position}</span>
                                <span>{exp.startDate} — {exp.endDate || "Present"}</span>
                            </div>
                            <div className="gap-0.5">
                                {exp.description.split('\n').map((line, idx) => {
                                    const trimmed = line.trim();
                                    if (!trimmed) return null;
                                    const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-');
                                    const content = isBullet ? trimmed.substring(1).trim() : trimmed;
                                    const finalContent = content.replace(/^[-•]\s*/, '');

                                    return (
                                        <p key={idx} className="flex">
                                            <span className="mr-2">•</span>
                                            <span>{finalContent}</span>
                                        </p>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </section>
            )}

            {/* Projects */}
            {data.projects.length > 0 && (
                <section className="mb-4">
                    <h2 className="text-sm font-bold uppercase border-b border-black mb-2">Projects</h2>
                    {data.projects.map((proj, i) => (
                        <div key={i} className="mb-4 print-break-avoid">
                            <div className="flex justify-between items-baseline">
                                <span className="font-bold text-gray-900">{proj.name}</span>
                                {proj.link && (
                                    <a href={proj.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                        Link ↗
                                    </a>
                                )}
                            </div>

                            {/* Tech Stack */}
                            <div className="text-xs font-semibold text-gray-600 mb-1 font-mono tracking-tight">
                                {Array.isArray(proj.technologies) ? proj.technologies.join(', ') : proj.technologies}
                            </div>

                            <p className="text-sm leading-snug text-gray-800">{proj.description}</p>
                        </div>
                    ))}
                </section>
            )}

            {/* Education */}
            {data.education.length > 0 && (
                <section className="mb-4">
                    <h2 className="text-sm font-bold uppercase border-b border-black mb-2">Education</h2>
                    {data.education.map((edu, i) => (
                        <div key={i} className="mb-2 print-break-avoid">
                            <div className="flex justify-between font-bold">
                                <span>{edu.school}</span>
                                <span>{edu.location}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="italic">{edu.degree}{edu.field ? `, ${edu.field}` : ''}</span>
                                <span>{edu.startDate} — {edu.endDate}</span>
                            </div>
                        </div>
                    ))}
                </section>
            )}

            {/* Volunteering */}
            {data.volunteering.length > 0 && (
                <section className="mb-4">
                    <h2 className="text-sm font-bold uppercase border-b border-black mb-2">Leadership & Volunteering</h2>
                    {data.volunteering.map((vol, i) => (
                        <div key={i} className="mb-2 print-break-avoid">
                            <div className="flex justify-between font-bold">
                                <span>{vol.organization}</span>
                                <span>{vol.startDate} — {vol.endDate || "Present"}</span>
                            </div>
                            <div className="italic mb-1">{vol.role}</div>
                            <p>{vol.description}</p>
                        </div>
                    ))}
                </section>
            )}

            {/* Certifications & Awards */}
            {(data.certifications.length > 0 || data.awards.length > 0) && (
                <section className="mb-4">
                    <h2 className="text-sm font-bold uppercase border-b border-black mb-2">Certifications & Awards</h2>
                    <ul className="list-disc list-outside ml-4">
                        {data.certifications.map((cert, i) => (
                            <li key={`cert-${i}`}>
                                <span className="font-bold">{cert.name}</span>, {cert.issuer} ({cert.date})
                            </li>
                        ))}
                        {data.awards.map((award, i) => (
                            <li key={`award-${i}`}>
                                <span className="font-bold">{award.title}</span>, {award.issuer} ({award.date})
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Publications */}
            {data.publications.length > 0 && (
                <section className="mb-4">
                    <h2 className="text-sm font-bold uppercase border-b border-black mb-2">Publications</h2>
                    <ul className="list-disc list-outside ml-4">
                        {data.publications.map((pub, i) => (
                            <li key={i}>
                                <span className="font-bold italic">{pub.title}</span>, {pub.publisher} ({pub.date})
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Print Footer */}
            <footer className="hidden print:block fixed bottom-0 left-0 w-full text-center text-xs text-gray-400 border-t pt-2 bg-white">
                <span className="font-semibold tracking-widest uppercase">{data.contact.firstName} {data.contact.lastName}</span>
            </footer>
        </div>
    );
}
