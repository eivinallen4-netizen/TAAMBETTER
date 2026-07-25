'use client';

import { useState, useEffect } from 'react';
import siteContent from '../content/siteContent.json';

type Tab = 'messaging' | 'hero' | 'projects' | 'team' | 'news' | 'contact' | 'leads';

interface Lead {
  id: string;
  biggest_challenge: string;
  services_interested: string[];
  name: string;
  email: string;
  phone: string;
  business_name: string;
  source_page: string;
  timestamp: string;
  crmStatus: 'sent' | 'failed' | 'not_configured';
  crmError?: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('messaging');
  const [content, setContent] = useState(siteContent);
  const [saved, setSaved] = useState(false);
  const [leads, setLeads] = useState<Lead[] | null>(null);

  useEffect(() => {
    if (activeTab !== 'leads' || leads !== null) return;
    fetch('/api/leads')
      .then((res) => res.json())
      .then((data) => setLeads(data))
      .catch((error) => console.error('Failed to load leads:', error));
  }, [activeTab, leads]);

  const deleteLead = async (id: string) => {
    try {
      const response = await fetch('/api/leads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (response.ok) {
        setLeads((prev) => (prev ?? []).filter((lead) => lead.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete lead:', error);
    }
  };

  const saveContent = async () => {
    try {
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });
      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-black mb-2">ADMIN DASHBOARD</h1>
          <p className="text-gray-400">Manage all your site content here</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-700 overflow-x-auto">
          {(['messaging', 'hero', 'projects', 'team', 'news', 'contact', 'leads'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-bold uppercase text-sm transition ${
                activeTab === tab
                  ? 'text-[#F46325] border-b-2 border-[#F46325]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-gray-800 rounded-lg p-8">
          {/* MESSAGING TAB */}
          {activeTab === 'messaging' && (
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-bold mb-2 text-[#F46325]">COMPANY NAME</label>
                <input
                  type="text"
                  value={content.company.name}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      company: { ...content.company, name: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-[#F46325]">TAGLINE</label>
                <input
                  type="text"
                  value={content.company.tagline}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      company: { ...content.company, tagline: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-[#F46325]">COMPANY DESCRIPTION</label>
                <textarea
                  value={content.company.description}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      company: { ...content.company, description: e.target.value },
                    })
                  }
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-[#F46325]">SERVICES (comma-separated)</label>
                <input
                  type="text"
                  value={content.company.services.join(', ')}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      company: { ...content.company, services: e.target.value.split(',').map((s) => s.trim()) },
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-[#F46325]">HOMEPAGE HEADLINE</label>
                <textarea
                  value={content.homepage.headline}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      homepage: { ...content.homepage, headline: e.target.value },
                    })
                  }
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-[#F46325]">HOMEPAGE DESCRIPTION</label>
                <textarea
                  value={content.homepage.description}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      homepage: { ...content.homepage, description: e.target.value },
                    })
                  }
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
            </div>
          )}

          {/* HERO TAB */}
          {activeTab === 'hero' && (
            <div className="space-y-8">
              {(['home', 'about', 'work'] as const).map((page) => (
                <div key={page} className="border-t border-gray-700 pt-8 first:border-0 first:pt-0">
                  <h3 className="text-xl font-bold mb-4 text-[#F46325] uppercase">{page} PAGE</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold mb-2">TITLE</label>
                      <input
                        type="text"
                        value={content.hero[page as keyof typeof content.hero].title}
                        onChange={(e) => {
                          const heroData = content.hero[page as keyof typeof content.hero];
                          setContent({
                            ...content,
                            hero: {
                              ...content.hero,
                              [page]: { ...heroData, title: e.target.value },
                            },
                          });
                        }}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold mb-2">SUBTITLE</label>
                      <input
                        type="text"
                        value={content.hero[page as keyof typeof content.hero].subtitle}
                        onChange={(e) => {
                          const heroData = content.hero[page as keyof typeof content.hero];
                          setContent({
                            ...content,
                            hero: {
                              ...content.hero,
                              [page]: { ...heroData, subtitle: e.target.value },
                            },
                          });
                        }}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold mb-2">BUTTON TEXT</label>
                      <input
                        type="text"
                        value={content.hero[page as keyof typeof content.hero].buttonText}
                        onChange={(e) => {
                          const heroData = content.hero[page as keyof typeof content.hero];
                          setContent({
                            ...content,
                            hero: {
                              ...content.hero,
                              [page]: { ...heroData, buttonText: e.target.value },
                            },
                          });
                        }}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                      />
                    </div>

                    {page === 'home' && (
                      <div>
                        <label className="block text-sm font-bold mb-2">VIDEO URL</label>
                        <input
                          type="text"
                          value={content.hero.home.videoSrc}
                          onChange={(e) =>
                            setContent({
                              ...content,
                              hero: {
                                ...content.hero,
                                home: { ...content.hero.home, videoSrc: e.target.value },
                              },
                            })
                          }
                          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                          placeholder="/your-video.mp4"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-bold mb-2">
                        IMAGE URL{page === 'home' ? ' (video poster / fallback)' : ''}
                      </label>
                      <input
                        type="text"
                        value={content.hero[page as keyof typeof content.hero].imageSrc}
                        onChange={(e) => {
                          const heroData = content.hero[page as keyof typeof content.hero];
                          setContent({
                            ...content,
                            hero: {
                              ...content.hero,
                              [page]: { ...heroData, imageSrc: e.target.value },
                            },
                          });
                        }}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                        placeholder="/your-image.jpg"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PROJECTS TAB */}
          {activeTab === 'projects' && (
            <div className="space-y-8">
              {content.projects.map((project, idx) => (
                <div key={project.id} className="border-t border-gray-700 pt-8 first:border-0 first:pt-0">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-[#F46325]">PROJECT {idx + 1}</h3>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm font-bold">
                        <input
                          type="checkbox"
                          checked={project.published !== false}
                          onChange={(e) => {
                            const updated = [...content.projects];
                            updated[idx].published = e.target.checked;
                            setContent({ ...content, projects: updated });
                          }}
                        />
                        PUBLISHED
                      </label>
                      <button
                        onClick={() => {
                          const updated = content.projects.filter((_, i) => i !== idx);
                          setContent({ ...content, projects: updated });
                        }}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        DELETE
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Project Title"
                      value={project.title}
                      onChange={(e) => {
                        const updated = [...content.projects];
                        updated[idx].title = e.target.value;
                        setContent({ ...content, projects: updated });
                      }}
                      className="px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                    <input
                      type="text"
                      placeholder="Category"
                      value={project.category}
                      onChange={(e) => {
                        const updated = [...content.projects];
                        updated[idx].category = e.target.value;
                        setContent({ ...content, projects: updated });
                      }}
                      className="px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                    <input
                      type="text"
                      placeholder="Image URL"
                      value={project.image}
                      onChange={(e) => {
                        const updated = [...content.projects];
                        updated[idx].image = e.target.value;
                        setContent({ ...content, projects: updated });
                      }}
                      className="px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                    <select
                      value={project.color}
                      onChange={(e) => {
                        const updated = [...content.projects];
                        updated[idx].color = e.target.value;
                        setContent({ ...content, projects: updated });
                      }}
                      className="px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    >
                      <option>red</option>
                      <option>cyan</option>
                      <option>yellow</option>
                      <option>purple</option>
                      <option>green</option>
                      <option>orange</option>
                      <option>blue</option>
                      <option>pink</option>
                    </select>
                    <select
                      value={project.size}
                      onChange={(e) => {
                        const updated = [...content.projects];
                        updated[idx].size = e.target.value as 'small' | 'wide' | 'tall' | 'large';
                        setContent({ ...content, projects: updated });
                      }}
                      className="px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    >
                      <option value="small">Small (1×1)</option>
                      <option value="wide">Wide (2×1)</option>
                      <option value="tall">Tall (1×2)</option>
                      <option value="large">Large (2×2)</option>
                    </select>
                  </div>

                  <textarea
                    placeholder="Project Description"
                    value={project.description}
                    onChange={(e) => {
                      const updated = [...content.projects];
                      updated[idx].description = e.target.value;
                      setContent({ ...content, projects: updated });
                    }}
                    rows={2}
                    className="w-full mt-4 px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <textarea
                      placeholder="Challenge"
                      value={project.challenge}
                      onChange={(e) => {
                        const updated = [...content.projects];
                        updated[idx].challenge = e.target.value;
                        setContent({ ...content, projects: updated });
                      }}
                      rows={2}
                      className="px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                    />
                    <textarea
                      placeholder="Solution"
                      value={project.solution}
                      onChange={(e) => {
                        const updated = [...content.projects];
                        updated[idx].solution = e.target.value;
                        setContent({ ...content, projects: updated });
                      }}
                      rows={2}
                      className="px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                    />
                    <textarea
                      placeholder="Results"
                      value={project.results}
                      onChange={(e) => {
                        const updated = [...content.projects];
                        updated[idx].results = e.target.value;
                        setContent({ ...content, projects: updated });
                      }}
                      rows={2}
                      className="px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                    />
                    <textarea
                      placeholder="Technologies"
                      value={project.technologies}
                      onChange={(e) => {
                        const updated = [...content.projects];
                        updated[idx].technologies = e.target.value;
                        setContent({ ...content, projects: updated });
                      }}
                      rows={2}
                      className="px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                    />
                  </div>
                </div>
              ))}

              <button
                onClick={() => {
                  const newProject = {
                    id: Math.max(0, ...content.projects.map((p) => p.id)) + 1,
                    published: true,
                    title: 'New Project',
                    category: 'Category',
                    description: '',
                    image: '/placeholder-project.jpg',
                    color: 'red',
                    size: 'small' as const,
                    challenge: '',
                    solution: '',
                    results: '',
                    technologies: '',
                  };
                  setContent({ ...content, projects: [...content.projects, newProject] });
                }}
                className="w-full px-4 py-3 bg-[#F46325] text-white font-bold rounded hover:bg-orange-600 transition mt-4"
              >
                + ADD PROJECT
              </button>
            </div>
          )}

          {/* TEAM TAB */}
          {activeTab === 'team' && (
            <div className="space-y-8">
              {content.team.map((member, idx) => (
                <div key={member.id} className="border-t border-gray-700 pt-8 first:border-0 first:pt-0">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-[#F46325]">TEAM MEMBER {idx + 1}</h3>
                    <button
                      onClick={() => {
                        const updated = content.team.filter((_, i) => i !== idx);
                        setContent({ ...content, team: updated });
                      }}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      DELETE
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Name"
                      value={member.name}
                      onChange={(e) => {
                        const updated = [...content.team];
                        updated[idx].name = e.target.value;
                        setContent({ ...content, team: updated });
                      }}
                      className="px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                    <input
                      type="text"
                      placeholder="Role"
                      value={member.role}
                      onChange={(e) => {
                        const updated = [...content.team];
                        updated[idx].role = e.target.value;
                        setContent({ ...content, team: updated });
                      }}
                      className="px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                    <input
                      type="text"
                      placeholder="Image URL"
                      value={member.image}
                      onChange={(e) => {
                        const updated = [...content.team];
                        updated[idx].image = e.target.value;
                        setContent({ ...content, team: updated });
                      }}
                      className="px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                  </div>

                  <textarea
                    placeholder="Bio"
                    value={member.bio}
                    onChange={(e) => {
                      const updated = [...content.team];
                      updated[idx].bio = e.target.value;
                      setContent({ ...content, team: updated });
                    }}
                    rows={2}
                    className="w-full mt-4 px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
              ))}

              <button
                onClick={() => {
                  const newMember = {
                    id: Math.max(...content.team.map((m) => m.id)) + 1,
                    name: 'New Team Member',
                    role: 'Role',
                    bio: '',
                    image: '/placeholder-person.jpg',
                  };
                  setContent({ ...content, team: [...content.team, newMember] });
                }}
                className="w-full px-4 py-3 bg-[#F46325] text-white font-bold rounded hover:bg-orange-600 transition mt-4"
              >
                + ADD TEAM MEMBER
              </button>
            </div>
          )}

          {/* NEWS TAB */}
          {activeTab === 'news' && (
            <div className="space-y-8">
              {content.news.map((item, idx) => (
                <div key={item.id} className="border-t border-gray-700 pt-8 first:border-0 first:pt-0">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-[#F46325]">NEWS {idx + 1}</h3>
                    <button
                      onClick={() => {
                        const updated = content.news.filter((_, i) => i !== idx);
                        setContent({ ...content, news: updated });
                      }}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      DELETE
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Title"
                      value={item.title}
                      onChange={(e) => {
                        const updated = [...content.news];
                        updated[idx].title = e.target.value;
                        setContent({ ...content, news: updated });
                      }}
                      className="px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white md:col-span-2"
                    />
                    <input
                      type="date"
                      value={item.date}
                      onChange={(e) => {
                        const updated = [...content.news];
                        updated[idx].date = e.target.value;
                        setContent({ ...content, news: updated });
                      }}
                      className="px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                    <input
                      type="text"
                      placeholder="Link URL"
                      value={item.link}
                      onChange={(e) => {
                        const updated = [...content.news];
                        updated[idx].link = e.target.value;
                        setContent({ ...content, news: updated });
                      }}
                      className="px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                  </div>

                  <textarea
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => {
                      const updated = [...content.news];
                      updated[idx].description = e.target.value;
                      setContent({ ...content, news: updated });
                    }}
                    rows={2}
                    className="w-full mt-4 px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
              ))}

              <button
                onClick={() => {
                  const newNews = {
                    id: Math.max(...content.news.map((n) => n.id)) + 1,
                    title: 'New Article',
                    description: '',
                    date: new Date().toISOString().split('T')[0],
                    link: '#',
                  };
                  setContent({ ...content, news: [...content.news, newNews] });
                }}
                className="w-full px-4 py-3 bg-[#F46325] text-white font-bold rounded hover:bg-orange-600 transition mt-4"
              >
                + ADD NEWS
              </button>
            </div>
          )}

          {/* CONTACT TAB */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold mb-2 text-[#F46325]">EMAIL</label>
                <input
                  type="email"
                  value={content.contact.email}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      contact: { ...content.contact, email: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-[#F46325]">PHONE</label>
                <input
                  type="tel"
                  value={content.contact.phone}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      contact: { ...content.contact, phone: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-[#F46325]">ADDRESS</label>
                <input
                  type="text"
                  value={content.contact.address}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      contact: { ...content.contact, address: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-[#F46325]">INSTAGRAM</label>
                <input
                  type="url"
                  value={content.contact.social.instagram}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      contact: {
                        ...content.contact,
                        social: { ...content.contact.social, instagram: e.target.value },
                      },
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-[#F46325]">TWITTER</label>
                <input
                  type="url"
                  value={content.contact.social.twitter}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      contact: {
                        ...content.contact,
                        social: { ...content.contact.social, twitter: e.target.value },
                      },
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-[#F46325]">LINKEDIN</label>
                <input
                  type="url"
                  value={content.contact.social.linkedin}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      contact: {
                        ...content.contact,
                        social: { ...content.contact.social, linkedin: e.target.value },
                      },
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
            </div>
          )}

          {/* LEADS TAB */}
          {activeTab === 'leads' && (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm mb-4">
                Contact form submissions, newest first. This tab is read-only and separate from the
                content you edit above — nothing here is affected by &quot;Save Changes&quot;.
              </p>
              {leads === null && <p className="text-gray-400">Loading…</p>}
              {leads !== null && leads.length === 0 && (
                <p className="text-gray-500">No submissions yet.</p>
              )}
              {(leads ?? []).map((lead) => (
                <div key={lead.id} className="border border-gray-700 rounded-lg p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h3 className="text-lg font-bold">{lead.name}</h3>
                      <p className="text-sm text-gray-400">
                        {new Date(lead.timestamp).toLocaleString()} &middot; from {lead.source_page || 'unknown page'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                          lead.crmStatus === 'sent'
                            ? 'bg-green-900 text-green-300'
                            : lead.crmStatus === 'failed'
                            ? 'bg-red-900 text-red-300'
                            : 'bg-gray-700 text-gray-300'
                        }`}
                        title={lead.crmError}
                      >
                        CRM: {lead.crmStatus.replace('_', ' ')}
                      </span>
                      <button
                        onClick={() => deleteLead(lead.id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        DELETE
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-300">
                    <div>
                      <span className="text-gray-500">Email: </span>
                      {lead.email}
                    </div>
                    <div>
                      <span className="text-gray-500">Phone: </span>
                      {lead.phone}
                    </div>
                    <div>
                      <span className="text-gray-500">Business: </span>
                      {lead.business_name || '—'}
                    </div>
                    <div>
                      <span className="text-gray-500">Biggest challenge: </span>
                      {lead.biggest_challenge}
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-gray-500">Services interested: </span>
                      {lead.services_interested.join(', ') || '—'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={saveContent}
            className="px-8 py-4 bg-[#F46325] text-white font-bold text-lg rounded hover:bg-orange-600 transition"
          >
            {saved ? '✓ SAVED' : 'SAVE CHANGES'}
          </button>
          <a
            href="/"
            className="px-8 py-4 bg-gray-700 text-white font-bold text-lg rounded hover:bg-gray-600 transition"
          >
            VIEW SITE
          </a>
        </div>
      </div>
    </div>
  );
}
