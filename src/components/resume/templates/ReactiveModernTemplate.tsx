import { MasterProfile, ResumeConfig } from "@/types/resume";
import { cn } from "@/lib/utils";
import {
    Mail, Phone, MapPin, Linkedin, Github, Globe,
    Briefcase, GraduationCap, Code, Award, Trophy,
    HeartHandshake, BookOpen, FolderGit2, Sparkles
} from "lucide-react";

interface ReactiveModernTemplateProps {
    data: MasterProfile;
    config?: ResumeConfig;
    className?: string;
}

export function ReactiveModernTemplate({ data, config, className }: ReactiveModernTemplateProps) {
    if (!data) return null;

    const accentColor = config?.accentColor || "#2563eb"; // Default to a nice blue

    return (
        <div className={cn("bg-white text-slate-900 shadow-lg max-w-[8.5in] mx-auto min-h-[11in] flex flex-row print:shadow-none print:max-w-none border print:border-none dark:border-slate-800 font-sans", className)} id="resume-preview">

            {/* Sidebar */}
            <aside className="w-[30%] bg-slate-50 p-8 border-r print:bg-slate-50 flex flex-col gap-8">
                {/* Contact Info */}
                <section>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 border-b pb-1">Contact</h2>
                    <ul className="space-y-3 text-[10pt]">
                        {data.contact.email && (
                            <li className="flex items-center gap-2">
                                <Mail className="h-4 w-4 shrink-0 text-slate-400" style={{ color: accentColor }} />
                                <span className="break-all">{data.contact.email}</span>
                            </li>
                        )}
                        {data.contact.phone && (
                            <li className="flex items-center gap-2">
                                <Phone className="h-4 w-4 shrink-0 text-slate-400" style={{ color: accentColor }} />
                                <span>{data.contact.phone}</span>
                            </li>
                        )}
                        {data.contact.location && (
                            <li className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 shrink-0 text-slate-400" style={{ color: accentColor }} />
                                <span>{data.contact.location}</span>
                            </li>
                        )}
                        {data.contact.linkedin && (
                            <li className="flex items-center gap-2 text-blue-600">
                                <Linkedin className="h-4 w-4 shrink-0" style={{ color: accentColor }} />
                                <a href={data.contact.linkedin} target="_blank" rel="noreferrer" className="hover:underline">LinkedIn</a>
                            </li>
                        )}
                        {data.contact.github && (
                            <li className="flex items-center gap-2">
                                <Github className="h-4 w-4 shrink-0" style={{ color: accentColor }} />
                                <a href={data.contact.github} target="_blank" rel="noreferrer" className="hover:underline">GitHub</a>
                            </li>
                        )}
                        {data.contact.portfolio && (
                            <li className="flex items-center gap-2">
                                <Globe className="h-4 w-4 shrink-0 text-slate-400" style={{ color: accentColor }} />
                                <a href={data.contact.portfolio} target="_blank" rel="noreferrer" className="hover:underline">Portfolio</a>
                            </li>
                        )}
                    </ul>
                </section>

                {/* Education */}
                {data.education.length > 0 && (
                    <section>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 border-b pb-1">Education</h2>
                        <div className="space-y-4">
                            {data.education.map((edu, i) => (
                                <div key={i} className="text-[10pt]">
                                    <h3 className="font-bold leading-tight">{edu.school}</h3>
                                    <p className="text-slate-600 italic leading-snug">{edu.degree}{edu.field ? `, ${edu.field}` : ''}</p>
                                    <p className="text-[9pt] text-slate-400 mt-0.5">{edu.startDate} — {edu.endDate}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Skills */}
                {data.skills.length > 0 && (
                    <section>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 border-b pb-1">Skills</h2>
                        <div className="space-y-4">
                            {data.skills.map((skill, i) => (
                                <div key={i} className="text-[10pt]">
                                    <h3 className="font-semibold text-slate-700 mb-1">{skill.category}</h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {String(skill.items || '').split(',').map((item, idx) => (
                                            <span key={idx} className="bg-white border rounded px-2 py-0.5 text-[9pt] shadow-sm">
                                                {item.trim()}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Interests */}
                {data.interests && (
                    <section>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 border-b pb-1">Interests</h2>
                        <p className="text-[10pt] text-slate-600">{data.interests}</p>
                    </section>
                )}
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-10 flex flex-col gap-8">
                {/* Header */}
                <header>
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                        {data.contact.firstName} <span style={{ color: accentColor }}>{data.contact.lastName}</span>
                    </h1>
                    {data.targetTitle && (
                        <p className="text-xl text-slate-500 font-medium mt-1">{data.targetTitle}</p>
                    )}
                </header>

                {/* Summary */}
                {data.summary && (
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="h-5 w-5" style={{ color: accentColor }} />
                            <h2 className="text-lg font-bold text-slate-800">Professional Summary</h2>
                        </div>
                        <p className="text-[10.5pt] leading-relaxed text-slate-700 text-justify">
                            {data.summary}
                        </p>
                    </section>
                )}

                {/* Experience */}
                {data.experience.length > 0 && (
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Briefcase className="h-5 w-5" style={{ color: accentColor }} />
                            <h2 className="text-lg font-bold text-slate-800">Experience</h2>
                        </div>
                        <div className="space-y-6">
                            {data.experience.map((exp, i) => (
                                <div key={i} className="relative pl-4 border-l-2 border-slate-100 group">
                                    <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-slate-300 group-hover:bg-[var(--accent-color)] transition-colors" style={{ backgroundColor: accentColor + '44' }} />
                                    <div className="flex justify-between items-start mb-1">
                                        <div>
                                            <h3 className="font-bold text-slate-900">{exp.position}</h3>
                                            <div className="text-sm font-medium" style={{ color: accentColor }}>{exp.company}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10pt] font-semibold text-slate-500">{exp.startDate} — {exp.endDate || "Present"}</div>
                                            <div className="text-[9pt] text-slate-400">{exp.location}</div>
                                        </div>
                                    </div>
                                    <div className="text-[10pt] text-slate-600 leading-relaxed space-y-1">
                                        {String(exp.description || '').split(/\r?\n/).map((line, idx) => {
                                            const trimmed = line.trim();
                                            if (!trimmed) return null;
                                            const finalContent = trimmed.replace(/^[-•]\s*/, '');
                                            return (
                                                <div key={idx} className="flex gap-2">
                                                    <span className="text-slate-300" style={{ color: accentColor + '88' }}>•</span>
                                                    <span>{finalContent}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Projects */}
                {data.projects.length > 0 && (
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <FolderGit2 className="h-5 w-5" style={{ color: accentColor }} />
                            <h2 className="text-lg font-bold text-slate-800">Projects</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {data.projects.map((proj, i) => (
                                <div key={i} className="bg-slate-50/50 rounded-lg p-4 border border-slate-100">
                                    <div className="flex justify-between items-center mb-1">
                                        <h3 className="font-bold text-slate-800">{proj.name}</h3>
                                        {proj.link && (
                                            <a href={proj.link} target="_blank" rel="noreferrer" className="text-xs hover:underline" style={{ color: accentColor }}>
                                                View Project ↗
                                            </a>
                                        )}
                                    </div>
                                    <p className="text-[10pt] text-slate-600 leading-snug">{proj.description || ''}</p>
                                    {proj.technologies && (
                                        <div className="mt-2 text-[9pt] font-mono text-slate-400">
                                            {proj.technologies}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Certifications & Awards */}
                {(data.certifications.length > 0 || data.awards.length > 0) && (
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Trophy className="h-5 w-5" style={{ color: accentColor }} />
                            <h2 className="text-lg font-bold text-slate-800">Certifications & Awards</h2>
                        </div>
                        <ul className="grid grid-cols-2 gap-x-8 gap-y-2 text-[10pt]">
                            {data.certifications.map((cert, i) => (
                                <li key={`cert-${i}`} className="flex gap-2">
                                    <Award className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                                    <span>
                                        <span className="font-bold">{cert.name}</span>, {cert.issuer}
                                    </span>
                                </li>
                            ))}
                            {data.awards.map((award, i) => (
                                <li key={`award-${i}`} className="flex gap-2">
                                    <Award className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                                    <span>
                                        <span className="font-bold">{award.title}</span>, {award.issuer}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </main>

            <style>{`
                @media print {
                    #resume-preview {
                        height: 11in;
                        width: 8.5in;
                        border: none !important;
                        box-shadow: none !important;
                    }
                    aside {
                        background-color: #f8fafc !important;
                        -webkit-print-color-adjust: exact;
                    }
                }
            `}</style>
        </div>
    );
}

