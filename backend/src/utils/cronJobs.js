import cron from 'cron';
import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import { sendWarningEmail } from './emailService.js';

// Check for approaching deadlines every hour
const deadlineChecker = new cron.CronJob('0 * * * *', async () => {
  try {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // Find complaints with deadlines approaching (within 2 hours)
    const approachingComplaints = await Complaint.find({
      deadline: { $gte: now, $lte: twoHoursLater },
      status: { $nin: ['resolved', 'verified', 'social_media'] }
    }).populate('assignedTo').populate('user');

    for (const complaint of approachingComplaints) {
      if (complaint.assignedTo) {
        // Send warning to assigned person
        await sendWarningEmail(
          complaint.assignedTo,
          complaint,
          'Deadline Approaching'
        );
      }
    }

    // Find complaints past deadline
    const pastDeadlineComplaints = await Complaint.find({
      deadline: { $lt: now },
      status: { $nin: ['resolved', 'verified', 'social_media', 'escalated'] }
    });

    for (const complaint of pastDeadlineComplaints) {
      // Auto-escalate if not already escalated
      if (complaint.escalationLevel < 3) {
        complaint.escalationLevel += 1;
        complaint.status = 'escalated';
        complaint.updatedAt = new Date();
        
        // Add to escalation history
        complaint.escalationHistory.push({
          level: complaint.escalationLevel,
          escalatedAt: new Date(),
          reason: 'Auto-escalated due to missed deadline',
          escalatedBy: null
        });

        await complaint.save();
      }
    }

    // Move to social media if past maximum escalation and still unresolved
    const maxEscalatedComplaints = await Complaint.find({
      escalationLevel: 3,
      deadline: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // 24 hours past deadline
      status: { $nin: ['resolved', 'verified', 'social_media'] }
    });

    for (const complaint of maxEscalatedComplaints) {
      complaint.status = 'social_media';
      complaint.updatedAt = new Date();
      await complaint.save();

      // Post to social media (mock function)
      await postToSocialMedia(complaint);
    }

  } catch (error) {
    console.error('Cron job error:', error);
  }
});

const postToSocialMedia = async (complaint) => {
  // This is a mock function. Integrate with actual social media APIs
  console.log(`Posting complaint ${complaint._id} to social media`);
  
  // Twitter/X API integration example:
  // const tweet = `Complaint unresolved: ${complaint.title}. Location: ${complaint.location.address}`;
  // await twitterClient.v2.tweet(tweet);
};

export const startCronJobs = () => {
  deadlineChecker.start();
  console.log('Cron jobs started');
};