'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CardTemplate {
  id: string;
  name: string;
  layout: {
    width: number;
    height: number;
    elements: {
      type: string;
      x: number;
      y: number;
      width: number;
      height: number;
      text?: string;
      fontSize?: number;
      fontFamily?: string;
      color?: string;
    }[];
  };
}

export default function CardDesignPage() {
  const [templates, setTemplates] = useState<CardTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cards/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      setTemplates(data.templates);
      if (data.templates.length > 0) {
        setSelectedTemplate(data.templates[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
    }
  };

  const handleElementUpdate = (elementIndex: number, updates: Partial<CardTemplate['layout']['elements'][0]>) => {
    if (!selectedTemplate) return;

    const updatedElements = [...selectedTemplate.layout.elements];
    updatedElements[elementIndex] = {
      ...updatedElements[elementIndex],
      ...updates,
    };

    setSelectedTemplate({
      ...selectedTemplate,
      layout: {
        ...selectedTemplate.layout,
        elements: updatedElements,
      },
    });
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;

    try {
      const response = await fetch('/api/cards/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedTemplate),
      });

      if (!response.ok) throw new Error('Failed to save template');
      
      // Show success message
      alert('Template saved successfully');
      
      // Refresh templates
      fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Card Design Editor</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            {previewMode ? 'Edit Mode' : 'Preview Mode'}
          </button>
          <button
            onClick={() => router.push('/admin/cards/inventory')}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Back to Inventory
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Template selector */}
          <div className="md:col-span-1">
            <div className="bg-white shadow rounded-lg p-4">
              <h2 className="text-lg font-medium mb-4">Templates</h2>
              <div className="space-y-2">
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    className={`w-full text-left px-4 py-2 rounded-md ${
                      selectedTemplate?.id === template.id
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Design editor */}
          <div className="md:col-span-3">
            <div className="bg-white shadow rounded-lg p-4">
              {selectedTemplate ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium">Edit Template</h2>
                    <button
                      onClick={handleSave}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                      Save Template
                    </button>
                  </div>

                  {/* Card preview/editor */}
                  <div
                    className="relative border-2 border-gray-300"
                    style={{
                      width: `${selectedTemplate.layout.width}px`,
                      height: `${selectedTemplate.layout.height}px`,
                    }}
                  >
                    {selectedTemplate.layout.elements.map((element, index) => (
                      <div
                        key={index}
                        className="absolute border border-dashed border-gray-400"
                        style={{
                          left: `${element.x}px`,
                          top: `${element.y}px`,
                          width: `${element.width}px`,
                          height: `${element.height}px`,
                        }}
                      >
                        {previewMode ? (
                          <div
                            className="w-full h-full"
                            style={{
                              fontSize: `${element.fontSize}px`,
                              fontFamily: element.fontFamily,
                              color: element.color,
                            }}
                          >
                            {element.text}
                          </div>
                        ) : (
                          <div className="p-2">
                            <input
                              type="text"
                              value={element.text || ''}
                              onChange={(e) => handleElementUpdate(index, { text: e.target.value })}
                              className="w-full mb-2"
                            />
                            <input
                              type="number"
                              value={element.fontSize || 12}
                              onChange={(e) => handleElementUpdate(index, { fontSize: parseInt(e.target.value) })}
                              className="w-full mb-2"
                            />
                            <input
                              type="text"
                              value={element.fontFamily || 'Arial'}
                              onChange={(e) => handleElementUpdate(index, { fontFamily: e.target.value })}
                              className="w-full mb-2"
                            />
                            <input
                              type="color"
                              value={element.color || '#000000'}
                              onChange={(e) => handleElementUpdate(index, { color: e.target.value })}
                              className="w-full"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Select a template to edit</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 