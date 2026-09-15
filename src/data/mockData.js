export const parent = {
  firstName: "Mariam",
  fullName: "Mariam Hassan",
  email: "mariam@example.com",

  hasChild: true,
  connectionStatus: "connected",
};


export const child = {
  preferredName: "Youssef",
  fullName: "Youssef Ahmed",
  age: 14,
  grade: "Grade 8",
  email: "youssef@example.com",
  subjects: ["Mathematics", "Science", "English"],
  studyPriorities: ["Consistent weekly study", "Core subjects"],
  suggestedGoal: null,
  invitationExpiresIn: "7 days",
};

export const invitation = {
  token: "demo-youssef",
  sharedItems: [
    "Study schedule",
    "Goals & routines",
    "Focus-session summaries",
  ],
};

export const dashboardData = {
  weeklyMinutes: 260,
  weeklyGoal: 360,

  focusPattern: [35, 48, 62, 80, 100, 72, 58],

  activeGoal: {
    title: "Weekly study goal",
    current: 260,
    target: 360,
  },

  recentSessions: [
    {
      subject: "Mathematics",
      duration: "50 min",
      time: "Today, Oct 20 · 5:10 PM",
    },
    {
      subject: "English Literature",
      duration: "35 min",
      time: "Yesterday, Oct 19 · 4:20 PM",
    },
    {
      subject: "Physics",
      duration: "22 min",
      time: "Oct 18 · 6:00 PM",
    },
  ],
};



// export const dashboardData = {
//   weeklyMinutes: 0,
//   weeklyGoal: 360,

//   focusPattern: [],

//   activeGoal: null,

//   recentSessions: [],
// };



export const dashboardMockData = {
  child: {
    id: "child-101",
    fullName: "Youssef Ahmed",
    preferredName: "Youssef",
    grade: "Grade 8",
    email: "youssef@example.com",
    connectionStatus: "connected",
    relationship: "Parent",
    guardianConfirmation: "confirmed",
    accessStatus: "active",
    subjects: ["Mathematics", "Science", "English"],
    priorities: ["Consistent weekly study", "Core subjects"],
    availableData: [
      "Session summaries",
      "Progress trends",
      "Study goals",
    ],
    invitation: {
      sentAt: "Sep 8, 2026",
      expiresAt: "Sep 15, 2026",
    },
    currentGoal: {
      targetMinutes: 300,
      completedMinutes: 180,
      status: "active",
    },
  },

  notifications: [
    {
      id: "notification-1",
      type: "alert",
      title: "Focus pattern changed",
      message:
        "Youssef’s focus has been lower than his recent pattern this week.",
      actionLabel: "View progress trend",
      actionPath: "/progress",
      isRead: false,
      date: "2 hours ago",
    },
    {
      id: "notification-2",
      type: "alert",
      title: "New session report available",
      message:
        "A processed summary is ready for Youssef’s Mathematics session.",
      actionLabel: "View report",
      actionPath: "/reports/session/session-101",
      isRead: false,
      date: "5 hours ago",
    },
    {
      id: "notification-3",
      type: "system",
      title: "Connection confirmed",
      message:
        "Your parent access to Youssef’s shared learning information is active.",
      actionLabel: "View child profile",
      actionPath: "/children",
      isRead: true,
      date: "Yesterday",
    },
  ],

  profile: {
    fullName: "Mariam Hassan",
    email: "mariam.hassan@example.com",
    phone: "+20 100 123 4567",
    memberSince: "September 2026",
    productUpdatesEnabled: true,
    importantNoticesEnabled: true,
  },

  reports: {
    sessions: [
      {
        id: "session-101",
        subject: "Mathematics",
        subjectCode: "MA",
        subjectIcon: "π",
        date: "Today, Oct 20 · 5:10 PM",
        durationMinutes: 50,
        format: "Digital",
        status: "completed",
        focusScore: 88,
        focusTrend: "improving",
        focusQuality: "Improving",
        completionPercent: 100,
        supportiveContext: {
          title: "A steady session",
          description:
            "The focus score reflects this session's processed pattern.",
        },
        focusChart: [
          { time: "4:20 PM", score: 42 },
          { time: "4:35 PM", score: 67 },
          { time: "4:50 PM", score: 76 },
          { time: "5:10 PM", score: 88 },
        ],
        learningResults: {
          available: true,
          mcqScore: 8,
          questionsCompleted: 10,
          correctAnswers: 8,
          resultPercent: 80,
        },
      },
      {
        id: "session-102",
        subject: "English Literature",
        subjectCode: "EN",
        subjectIcon: "ABC",
        date: "Yesterday, Oct 19 · 4:20 PM",
        durationMinutes: 35,
        format: "Paper notes",
        status: "completed",
        focusScore: 82,
        focusTrend: "stable",
        focusQuality: "Calm interval",
        completionPercent: 100,
        supportiveContext: {
          title: "A consistent session",
          description:
            "Youssef maintained a steady focus rhythm through this session.",
        },
        focusChart: [
          { time: "3:40 PM", score: 55 },
          { time: "3:55 PM", score: 65 },
          { time: "4:10 PM", score: 71 },
          { time: "4:20 PM", score: 82 },
        ],
        learningResults: {
          available: true,
          mcqScore: 7,
          questionsCompleted: 9,
          correctAnswers: 7,
          resultPercent: 78,
        },
      },
      {
        id: "session-103",
        subject: "Physics",
        subjectCode: "PH",
        subjectIcon: "⚛",
        date: "Oct 18 · 6:00 PM",
        durationMinutes: 22,
        format: "Digital",
        status: "paused",
        focusScore: null,
        focusTrend: null,
        focusQuality: "Not evaluated",
        completionPercent: 62,
        supportiveContext: null,
        focusChart: [],
        learningResults: {
          available: false,
        },
      },
      {
        id: "session-104",
        subject: "History",
        subjectCode: "HI",
        subjectIcon: "⌛",
        date: "Oct 16 · 4:55 PM",
        durationMinutes: 31,
        format: "Study session",
        status: "completed",
        focusScore: 80,
        focusTrend: "improving",
        focusQuality: "Improving",
        completionPercent: 100,
        supportiveContext: {
          title: "An improving session",
          description:
            "Focus increased gradually as the session progressed.",
        },
        focusChart: [
          { time: "4:55 PM", score: 45 },
          { time: "5:05 PM", score: 56 },
          { time: "5:15 PM", score: 68 },
          { time: "5:26 PM", score: 80 },
        ],
        learningResults: {
          available: false,
        },
      },
    ],
  },
};

export const studyGoalMock = {
  status: "accepted",

  frequency: "Weekly",
  targetMinutes: 360,
  completedMinutes: 260,
  cycle: "Oct 14 - Oct 20",

  suggestedBy: "Mariam",
  acceptedBy: "Youssef",

  daysRemaining: 2,

  dailyProgress: [
    { day: "Monday", minutes: 40 },
    { day: "Tuesday", minutes: 55 },
    { day: "Wednesday", minutes: 45 },
    { day: "Thursday", minutes: 60 },
    { day: "Friday", minutes: 60 },
  ],
};

export const progressMock = {
  focusQuality: {
    average: 82,
    changePercent: 8,
    trend: "improving",
    points: [45, 53, 58, 66, 72, 77, 82],
  },

  studyTime: {
    totalMinutes: 485,
    changeMinutes: 80,
    points: [30, 46, 55, 43, 50, 72, 89, 58, 77, 92, 108],
  },

  subjects: [
    {
      name: "Mathematics",
      icon: "π",
      sessions: 8,
      totalMinutes: 320,
      trend: "improving",
      hasEnoughData: true,
    },
    {
      name: "Science",
      icon: "⚗",
      sessions: 4,
      totalMinutes: 130,
      trend: "stable",
      hasEnoughData: true,
    },
    {
      name: "English",
      icon: "ABC",
      sessions: 1,
      totalMinutes: 35,
      trend: null,
      hasEnoughData: false,
    },
  ],

  timeOfDayPattern: "Afternoon",
};