import { FeedbackRepository } from '../domain/feedback.repository';

interface ApproveFeedbackInput {
  id: string;
  approvedBy: string;
}

export class ApproveFeedbackUseCase {
  constructor(private readonly feedbackRepository: FeedbackRepository) {}

  async execute(input: ApproveFeedbackInput): Promise<void> {
    if (!input.id) {
      throw new Error('Feedback id is required');
    }

    if (!input.approvedBy) {
      throw new Error('approvedBy is required');
    }

    const feedback = await this.feedbackRepository.findById(input.id);

    if (!feedback) {
      throw new Error('Feedback not found');
    }

    feedback.approve(input.approvedBy);

    await this.feedbackRepository.update(feedback);
  }
}
