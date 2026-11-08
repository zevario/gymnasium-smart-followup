const generateReminderDraft = async () => ({
  available: false,
  provider: null,
  reason: 'Generative AI provider is not configured.',
});

const generateFollowupDraft = async () => ({
  available: false,
  provider: null,
  draft: null,
  reason: 'Generative AI provider is not configured.',
});

const getDraftGeneratorStatus = async () => ({
  available: false,
  provider: null,
  reason: 'Generative AI provider is not configured.',
});

const DraftGeneratorService = {
  generateReminderDraft,
  generateFollowupDraft,
  getDraftGeneratorStatus,
};

export default DraftGeneratorService;
