export interface ScheduleItem {
  time: string;
  event: string;
  details?: string[];
}

export interface ScheduleBound {
  day: string;
  date: string;
  time: string;
  event: string;
}

export const scheduleStart: ScheduleBound = {
  day: 'Saturday',
  date: 'October 3',
  time: '1:30 PM',
  event: 'Check-In Opens',
};

export const scheduleEnd: ScheduleBound = {
  day: 'Sunday',
  date: 'October 4',
  time: '5:00–5:30 PM',
  event: 'Awards & Closing Ceremony',
};

export const day1: ScheduleItem[] = [
  {
    time: '1:30 PM',
    event: 'Check-In Opens',
  },
  {
    time: '2:00 PM',
    event: 'Opening Ceremony',
    details: [
      'Welcome speech',
      'Committee leads introductions',
      'Mentor introductions',
      'Sponsor introductions',
      'Rules and judging criteria',
      'Logistics and safety information',
    ],
  },
  {
    time: '3:00 PM',
    event: 'Hacking Begins',
  },
  {
    time: '3:15–4:00 PM',
    event: 'Team Formation and Workshop #1',
    details: [
      'Last chance for participants without teams',
      'Intro to Git/GitHub',
      'AI Tools for Developers',
      'Your First Hackathon Project',
    ],
  },
  {
    time: '6:00 PM',
    event: 'Dinner and Mentor Mingling',
  },
  {
    time: '8:00 PM',
    event: 'Ping pong party in the gym',
  },
  {
    time: '12:00 AM',
    event: 'Midnight Snack and Mario Kart',
  },
];

export const day2: ScheduleItem[] = [
  {
    time: '2:00 AM',
    event: 'Karaoke',
  },
  {
    time: '8:00 AM',
    event: 'Breakfast',
  },
  {
    time: '10:00 AM',
    event: 'Workshop #3',
    details: [
      'Presentation tips, demo preparation, and how to submit to Devpost with Aamir',
    ],
  },
  {
    time: '12:00 PM',
    event: 'Lunch',
  },
  {
    time: '1:00 PM',
    event: 'Final Hour Warning',
    details: ['Submit code by 2:00 PM'],
  },
  {
    time: '2:00 PM',
    event: 'Hacking Ends',
    details: ['Project submissions close'],
  },
  {
    time: '2:00–3:00 PM',
    event: 'Devpost review and demo prep',
    details: ['Review other projects', 'Teams prepare for demos'],
  },
  {
    time: '3:00–4:00 PM',
    event: 'Technical demos and live presentations',
  },
  {
    time: '4:00–5:00 PM',
    event: 'Judges deliberate',
    details: [
      'Free time',
      'Food and snacks',
    ],
  },
  {
    time: '5:00–5:30 PM',
    event: 'Awards & Closing Ceremony',
    details: [
      'Winning teams announced',
      'Prize selection',
      'Sponsor recognition',
      'Thank participants',
      'Group photo',
    ],
  },
];
