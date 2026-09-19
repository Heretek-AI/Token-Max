import { describe, it, expect } from 'vitest';
import {
  generateAiderConfig,
  generateContinueConfig,
  generateClineConfig,
  generateOpenCodeConfig,
  generateCursorRules,
  generateAllConfigs,
  type AgentStackConfig,
} from './exporters';

describe('BYOK Config Exporters', () => {
  const sampleConfig: AgentStackConfig = {
    architectModelId: 'anthropic/claude-sonnet-5',
    architectModelName: 'Claude Sonnet 5',
    editorModelId: 'deepseek/deepseek-v4.1-flash',
    editorModelName: 'DeepSeek V4.1 Flash',
    autocompleteModelId: 'deepseek/deepseek-v4.1-flash',
    autocompleteModelName: 'DeepSeek V4.1 Flash',
    provider: 'openrouter',
    enablePromptCaching: true,
  };

  it('generates valid Aider configuration with prompt caching enabled', () => {
    const file = generateAiderConfig(sampleConfig);
    expect(file.filename).toBe('.aider.conf.yml');
    expect(file.content).toContain('model: openrouter/anthropic/claude-sonnet-5');
    expect(file.content).toContain('editor-model: openrouter/deepseek/deepseek-v4.1-flash');
    expect(file.content).toContain('cache-prompts: true');
    expect(file.content).toContain('stream: true');
    expect(file.runCommand).toContain('OPENROUTER_API_KEY');
  });

  it('generates valid Continue.dev JSON configuration', () => {
    const file = generateContinueConfig(sampleConfig);
    expect(file.filename).toBe('config.json');

    // Must be valid JSON
    const parsed = JSON.parse(file.content);
    expect(parsed.models).toHaveLength(2);
    expect(parsed.models[0].model).toBe('anthropic/claude-sonnet-5');
    expect(parsed.models[1].model).toBe('deepseek/deepseek-v4.1-flash');
    expect(parsed.tabAutocompleteModel).toBeDefined();
    expect(parsed.tabAutocompleteModel.model).toBe('deepseek/deepseek-v4.1-flash');
  });

  it('generates valid Cline / Roo Code settings JSON', () => {
    const file = generateClineConfig(sampleConfig);
    expect(file.filename).toBe('cline_custom_modes.json');

    const parsed = JSON.parse(file.content);
    expect(parsed.apiProvider).toBe('openrouter');
    expect(parsed.customModePrompts.architect.model).toBe('anthropic/claude-sonnet-5');
    expect(parsed.customModePrompts.code.model).toBe('deepseek/deepseek-v4.1-flash');
    expect(parsed.enablePromptCaching).toBe(true);
  });

  it('generates valid OpenCode router configuration', () => {
    const file = generateOpenCodeConfig(sampleConfig);
    expect(file.filename).toBe('opencode.json');

    const parsed = JSON.parse(file.content);
    expect(parsed.router.primaryModel).toBe('anthropic/claude-sonnet-5');
    expect(parsed.router.fastModel).toBe('deepseek/deepseek-v4.1-flash');
    expect(parsed.router.caching).toBe(true);
  });

  it('generates Cursor rules with model directives and cache guidance', () => {
    const file = generateCursorRules(sampleConfig);
    expect(file.filename).toBe('.cursorrules');
    expect(file.content).toContain('Claude Sonnet 5');
    expect(file.content).toContain('DeepSeek V4.1 Flash');
    expect(file.content).toContain('prompt-cache');
  });

  it('generates all 5 configuration files consistently in generateAllConfigs', () => {
    const files = generateAllConfigs(sampleConfig);
    expect(files).toHaveLength(5);
    const filenames = files.map((f) => f.filename);
    expect(filenames).toContain('.aider.conf.yml');
    expect(filenames).toContain('config.json');
    expect(filenames).toContain('cline_custom_modes.json');
    expect(filenames).toContain('opencode.json');
    expect(filenames).toContain('.cursorrules');
  });

  it('injects custom base URL when custom provider is specified', () => {
    const customConfig: AgentStackConfig = {
      ...sampleConfig,
      provider: 'custom',
      customBaseUrl: 'http://localhost:11434/v1',
    };

    const aider = generateAiderConfig(customConfig);
    expect(aider.content).toContain('openai-api-base: http://localhost:11434/v1');

    const continueFile = generateContinueConfig(customConfig);
    const parsedContinue = JSON.parse(continueFile.content);
    expect(parsedContinue.models[0].apiBase).toBe('http://localhost:11434/v1');
  });

  it('sanitizes newline and YAML delimiter injections in aider config', () => {
    const maliciousConfig: AgentStackConfig = {
      ...sampleConfig,
      architectModelId: 'claude-3-5\n  malicious_key: evil_payload',
      editorModelId: '# injected comment',
      provider: 'custom',
      customBaseUrl: 'http://localhost:8000\nfoo: bar',
    };

    const aider = generateAiderConfig(maliciousConfig);
    expect(aider.content).not.toContain('\n  malicious_key: evil_payload');
    expect(aider.content).not.toContain('\nfoo: bar');
  });
});
