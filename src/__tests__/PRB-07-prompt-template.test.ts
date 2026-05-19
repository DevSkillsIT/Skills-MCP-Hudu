/**
 * PRB-07: Asset history prompt template cleanup (REQ-18)
 *
 * Tests:
 * - The hudu_asset_history prompt does not instruct to call manage_it_asset_inventory
 *   with fields.company_id (the fields param is only for filtered list views)
 * - Rendered prompt text should not contain "fields.company_id"
 */

import { getHuduPromptText } from '../prompts.js';

describe('PRB-07: Asset history prompt template', () => {
  const assetId = 123;

  test('prompt renders without error', () => {
    const result = getHuduPromptText('hudu_asset_history', { asset_id: String(assetId) });
    expect(result).toBeTruthy();
    expect(result).toHaveProperty('messages');
  });

  test('prompt does not contain fields.company_id instruction', () => {
    const result = getHuduPromptText('hudu_asset_history', { asset_id: String(assetId) });
    const promptText = JSON.stringify(result);
    // The fields parameter is only for filtered list views, not for get by ID
    expect(promptText).not.toContain('fields.company_id');
  });

  test('prompt contains correct instruction to get asset by ID', () => {
    const result = getHuduPromptText('hudu_asset_history', { asset_id: String(assetId) });
    const promptText = JSON.stringify(result);
    // Should reference searching for the asset, not using fields.company_id
    expect(promptText).toContain(String(assetId));
  });
});
