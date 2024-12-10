import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useImageGeneration, type GenerationOptions } from '../hooks/useImageGeneration';
import { FaImage, FaMagic, FaCog, FaInfoCircle, FaLightbulb, FaRedo } from 'react-icons/fa';
import type { Post } from '../types/database';

export default function Create() {
  const navigate = useNavigate();
  const { generateImage, generateAndSaveImage, loading, error, clearError } = useImageGeneration();
  const [prompt, setPrompt] = useState('');
  const [caption, setCaption] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<Post | null>(null);
  const [options, setOptions] = useState<GenerationOptions>({
    quality: 'standard',
    style: 'vivid',
    size: '1024x1024'
  });

  // Clear error when prompt changes
  useEffect(() => {
    if (error) clearError();
  }, [prompt]);

  const promptSuggestions = [
    "A serene Japanese garden with cherry blossoms",
    "Futuristic cityscape at sunset",
    "Abstract representation of human emotions",
    "Underwater scene with bioluminescent creatures",
    "Steampunk-inspired mechanical butterfly"
  ];

  const promptTips = [
    "Be specific about the style you want (e.g., oil painting, digital art, photography)",
    "Include details about lighting, colors, and mood",
    "Specify the perspective or angle you want",
    "Mention any particular artistic influences",
    "Include details about the setting and environment"
  ];

  async function handlePreview() {
    if (!prompt.trim()) return;

    const imageUrl = await generateImage(prompt, options);
    if (imageUrl) {
      setPreviewUrl(imageUrl);
      setGeneratedPost(null); // Clear any previously generated post
    }
  }

  async function handleGenerateAndSave() {
    if (!prompt.trim()) return;

    const post = await generateAndSaveImage(prompt, options, caption);
    if (post) {
      setGeneratedPost(post);
      setPreviewUrl(post.image_url);
    }
  }

  function handleViewProfile() {
    navigate('/profile');
  }

  function handleRegenerateImage() {
    setPreviewUrl(null);
    setGeneratedPost(null);
    handlePreview();
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Controls */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">Create AI Art</h2>
              
              {/* Prompt Input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prompt
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe the image you want to create..."
                  />
                </div>

                {/* Writing Tips */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700 mb-2">
                    <FaLightbulb />
                    <span className="font-medium">Prompt Writing Tips</span>
                  </div>
                  <ul className="text-sm text-blue-600 space-y-1 list-disc list-inside">
                    {promptTips.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                </div>

                {/* Prompt Suggestions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Try These Prompts
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {promptSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setPrompt(suggestion)}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Caption Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Caption (optional)
                  </label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add a caption to your creation..."
                  />
                </div>

                {/* Advanced Options */}
                <div>
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <FaCog className="text-lg" />
                    <span>Advanced Options</span>
                  </button>

                  {showAdvanced && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quality
                        </label>
                        <select
                          value={options.quality}
                          onChange={(e) => setOptions({ ...options, quality: e.target.value as 'standard' | 'hd' })}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="standard">Standard</option>
                          <option value="hd">HD</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Style
                        </label>
                        <select
                          value={options.style}
                          onChange={(e) => setOptions({ ...options, style: e.target.value as 'vivid' | 'natural' })}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="vivid">Vivid</option>
                          <option value="natural">Natural</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Size
                        </label>
                        <select
                          value={options.size}
                          onChange={(e) => setOptions({ ...options, size: e.target.value as '1024x1024' | '1792x1024' | '1024x1792' })}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="1024x1024">Square (1024x1024)</option>
                          <option value="1792x1024">Landscape (1792x1024)</option>
                          <option value="1024x1792">Portrait (1024x1792)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="text-red-500 text-sm flex items-center gap-2 bg-red-50 p-3 rounded-lg">
                    <FaInfoCircle />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex gap-3">
                  {!generatedPost ? (
                    <>
                      <button
                        onClick={handlePreview}
                        disabled={loading || !prompt.trim()}
                        className="flex-1 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                      >
                        <FaImage />
                        <span>Preview</span>
                      </button>

                      <button
                        onClick={handleGenerateAndSave}
                        disabled={loading || !prompt.trim()}
                        className="flex-1 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                            <span>Creating...</span>
                          </>
                        ) : (
                          <>
                            <FaMagic />
                            <span>Generate & Share</span>
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleRegenerateImage}
                        disabled={loading}
                        className="flex-1 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                      >
                        <FaRedo />
                        <span>Regenerate</span>
                      </button>

                      <button
                        onClick={handleViewProfile}
                        className="flex-1 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center justify-center gap-2 transition-colors"
                      >
                        <FaImage />
                        <span>View in Profile</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Preview & Tips */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium mb-4">Preview</h3>
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={prompt}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400 flex flex-col items-center">
                    <FaImage className="text-6xl mb-2" />
                    <span>Your creation will appear here</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 