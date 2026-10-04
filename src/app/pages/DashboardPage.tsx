import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  Users,
  Calendar,
  Trophy,
  LogOut,
  Menu,
  X,
  User,
  Code2,
  MessageSquare,
  FileText,
  Bell,
  QrCode,
  UserPlus,
  UserMinus,
  Send,
  ExternalLink,
  Award,
  DollarSign,
  HelpCircle,
  Building2,
  Wifi,
} from 'lucide-react';
import QRCode from 'react-qr-code';
import {
  getAnnouncements,
  formatAnnouncementTime,
  getTeams,
  createTeam,
  joinTeam,
  leaveTeam,
  removeTeammate,
  submitTeamForJudging,
  type StoredAnnouncement,
  type StoredTeam,
} from '@/lib/hackathonStorage';
import type { User } from '../context/AuthContext';
import {
  DISCORD_URL,
  EVENT_CAMPUS,
  EVENT_CITY,
  EVENT_VENUE,
} from '@/data/links';
import { SponsorCarousel } from '../components/SponsorCarousel';
import { WifiGuide } from '../components/WifiGuide';
import { ScheduleAgenda } from '../components/ScheduleAgenda';
import { SeoHead } from '../components/SeoHead';

export function DashboardPage() {
  const [currentView, setCurrentView] = useState('checkin');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { id: 'checkin', label: 'Check-In', icon: QrCode },
    { id: 'announcements', label: 'Announcements', icon: Bell },
    { id: 'team', label: 'My Team', icon: Users },
    { id: 'resources', label: 'Resources', icon: FileText },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-brand">
      <SeoHead
        title="Dashboard | Mule Hacks 2026"
        description="Your Mule Hacks 2026 attendee dashboard."
        noIndex
      />
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 w-full z-50 bg-[#000000]/90 backdrop-blur-md border-b border-white/20">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-2">
            <Code2 className="w-6 h-6 text-white" />
            <span className="font-bold text-white">Mule Hacks</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white p-2"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="lg:hidden fixed inset-y-0 left-0 z-40 w-64 bg-[#000000]/90 backdrop-blur-xl border-r border-white/10 pt-20"
          >
            <nav className="flex flex-col h-full">
              <div className="flex-1 px-4 py-6 space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      currentView === item.id
                        ? 'bg-[#000000] text-white'
                        : 'text-white/80 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
              <div className="p-4 border-t border-white/10">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/5 hover:text-white transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 w-64 bg-[#000000]/90 backdrop-blur-xl border-r border-white/20">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Code2 className="w-8 h-8 text-white" />
              <span className="font-bold text-xl text-white">Mule Hacks</span>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  currentView === item.id
                    ? 'bg-[#000000] text-white shadow-lg'
                    : 'text-white/80 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/5 hover:text-white transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentView === 'checkin' && <CheckInView user={user} />}
              {currentView === 'announcements' && <AnnouncementsView />}
              {currentView === 'team' && <TeamView user={user} />}
              {currentView === 'resources' && <ResourcesView />}
              {currentView === 'profile' && <ProfileView user={user} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function CheckInView({ user }: { user: any }) {
  const qrValue = `MULEHACKS2026-${user?.email || 'user'}`;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl text-white mb-2">Event Check-In</h1>
        <p className="text-white/80">Show this QR code at registration</p>
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl p-8 shadow-2xl"
      >
        <div className="flex justify-center mb-6">
          <QRCode
            value={qrValue}
            size={256}
            style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
            viewBox={`0 0 256 256`}
          />
        </div>
        <div className="text-center">
          <p className="text-gray-600 text-sm mb-2">Scan Code ID</p>
          <p className="text-gray-900 font-mono text-xs bg-gray-100 px-4 py-2 rounded-lg inline-block">
            {qrValue}
          </p>
        </div>
      </motion.div>

      <div className="bg-[#000000]/30 backdrop-blur-sm border border-white/20 rounded-xl p-6 space-y-4">
        <h3 className="text-xl text-white mb-4">Your Information</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-white/80 text-sm mb-1">Name</p>
            <p className="text-white">{user?.name || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-white/80 text-sm mb-1">Email</p>
            <p className="text-white">{user?.email || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-white/80 text-sm mb-1">University</p>
            <p className="text-white">{user?.university || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-white/80 text-sm mb-1">Team</p>
            <p className="text-white">{user?.teamName || 'No team yet'}</p>
          </div>
        </div>
      </div>

      <div className="bg-[#000000] rounded-xl p-6">
        <h3 className="text-white text-lg mb-2">Important Reminder</h3>
        <p className="text-white/90">
          Keep this QR code accessible during the event. You'll need it for check-in, meals, and swag pickup.
        </p>
      </div>
    </div>
  );
}

function AnnouncementsView() {
  const [announcements, setAnnouncements] = useState<StoredAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await getAnnouncements();
        if (!cancelled) setAnnouncements(list);
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [expandedAnnouncement, setExpandedAnnouncement] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<Record<string, string>>({});

  const handleAddComment = (announcementId: string) => {
    if (commentText[announcementId]?.trim()) {
      alert('Comment posted! (This is a demo - actual posting will be implemented)');
      setCommentText({ ...commentText, [announcementId]: '' });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl sm:text-4xl text-white mb-2">Announcements</h1>
        <p className="text-white/80">Stay updated with the latest news and updates</p>
      </div>

      {loading && <p className="text-white/60">Loading announcements…</p>}
      {!loading && announcements.length === 0 && (
        <p className="text-white/60">No announcements yet.</p>
      )}

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <motion.div
            key={announcement.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#000000]/30 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:border-white/50 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-xl text-white mb-2">{announcement.title}</h3>
                <p className="text-white/90 mb-3">{announcement.message}</p>
                <div className="flex items-center gap-4 text-sm text-white/80">
                  <span>Posted by {announcement.author}</span>
                  <span>•</span>
                  <span>{formatAnnouncementTime(announcement.createdAt)}</span>
                </div>
              </div>
              <Bell className="w-5 h-5 text-white flex-shrink-0" />
            </div>

            <div className="border-t border-white/10 pt-4 mt-4">
              <button
                onClick={() =>
                  setExpandedAnnouncement(
                    expandedAnnouncement === announcement.id ? null : announcement.id
                  )
                }
                className="text-white hover:text-white/80 text-sm flex items-center gap-2 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                {announcement.comments.length} Comments
              </button>

              <AnimatePresence>
                {expandedAnnouncement === announcement.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 space-y-3 overflow-hidden"
                  >
                    {announcement.comments.map((comment, idx) => (
                      <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#000000] flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-sm">{comment.author.charAt(0)}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-white text-sm mb-1">{comment.author}</p>
                            <p className="text-white/90 text-sm">{comment.message}</p>
                            <p className="text-white/70 text-xs mt-1">{comment.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="flex gap-2 mt-3">
                      <input
                        type="text"
                        value={commentText[announcement.id] || ''}
                        onChange={(e) =>
                          setCommentText({ ...commentText, [announcement.id]: e.target.value })
                        }
                        placeholder="Add a comment..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:border-white transition-colors"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAddComment(announcement.id);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleAddComment(announcement.id)}
                        className="bg-[#000000] hover:bg-[#000000] text-white px-4 py-2 rounded-lg transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(187,0,0,0.5),0_0_30px_rgba(187,0,0,0.3)] hover:shadow-[0_0_25px_rgba(221,0,0,0.6),0_0_50px_rgba(221,0,0,0.4)]"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function TeamView({ user }: { user: User | null }) {
  const [myTeam, setMyTeam] = useState<StoredTeam | null>(null);
  const [otherTeams, setOtherTeams] = useState<StoredTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [teamCode, setTeamCode] = useState('');
  const [teamName, setTeamName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState('');

  const refreshTeams = async () => {
    const teams = await getTeams();
    const email = user?.email?.toLowerCase();
    const mine = email
      ? teams.find((t) => t.memberEmails.map((e) => e.toLowerCase()).includes(email)) || null
      : null;
    setMyTeam(mine);
    setOtherTeams(teams.filter((t) => t.id !== mine?.id));
    if (mine?.project) setProjectName(mine.project);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refreshTeams();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load teams');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  const handleCreate = async () => {
    setBusy(true);
    setError('');
    try {
      const team = await createTeam({
        name: teamName.trim() || `${user?.name || 'My'}'s Team`,
      });
      setMyTeam(team);
      await refreshTeams();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team');
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async () => {
    if (!teamCode.trim()) {
      setError('Enter a team code');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const team = await joinTeam(teamCode.trim());
      setMyTeam(team);
      setShowJoinModal(false);
      setTeamCode('');
      await refreshTeams();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join team');
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveTeammate = async (email: string) => {
    if (!myTeam) return;
    const warning = myTeam.submittedForJudging
      ? `Remove ${email} from the team? This team is already submitted for judging, so you will need to submit again.`
      : `Remove ${email} from the team?`;
    if (!confirm(warning)) return;
    setBusy(true);
    setError('');
    try {
      const team = await removeTeammate(myTeam.id, email);
      setMyTeam(team);
      await refreshTeams();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove teammate');
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = async () => {
    if (!myTeam || !confirm('Are you sure you want to leave this team?')) return;
    setBusy(true);
    setError('');
    try {
      await leaveTeam(myTeam.id);
      setMyTeam(null);
      await refreshTeams();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave team');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitForJudging = async () => {
    if (!myTeam) return;
    if (!projectName.trim()) {
      setError('Enter your project name to submit for judging.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const team = await submitTeamForJudging(myTeam.id, projectName.trim());
      setMyTeam(team);
      await refreshTeams();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit for judging');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <p className="text-white/60">Loading teams…</p>
      </div>
    );
  }

  if (!myTeam) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl sm:text-4xl text-white mb-2">My Team</h1>
          <p className="text-white/80">Form or join a team to collaborate</p>
        </div>

        <div className="bg-[#000000]/30 backdrop-blur-sm border border-white/20 rounded-xl p-12 text-center">
          <Users className="w-20 h-20 text-white/50 mx-auto mb-6" />
          <h3 className="text-2xl text-white mb-3">You're not on a team yet</h3>
          <p className="text-white/80 mb-8 max-w-md mx-auto">
            Teams can have up to 4 members. Create a new team or join an existing one to start collaborating!
          </p>

          <div className="max-w-md mx-auto mb-6">
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Team name (optional)"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              disabled={busy}
              onClick={() => void handleCreate()}
              className="bg-[#000000] hover:bg-[#000000] text-white px-8 py-3 rounded-lg transition-all flex items-center gap-2 justify-center shadow-[0_0_20px_rgba(187,0,0,0.5),0_0_40px_rgba(187,0,0,0.3),0_0_60px_rgba(187,0,0,0.2)] hover:shadow-[0_0_30px_rgba(221,0,0,0.6),0_0_60px_rgba(221,0,0,0.4),0_0_80px_rgba(221,0,0,0.3)] disabled:opacity-50"
            >
              <UserPlus className="w-5 h-5" />
              Create Team
            </button>
            <button
              disabled={busy}
              onClick={() => setShowJoinModal((v) => !v)}
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-3 rounded-lg transition-all flex items-center gap-2 justify-center disabled:opacity-50"
            >
              <Users className="w-5 h-5" />
              Join Team
            </button>
          </div>

          {showJoinModal && (
            <div className="mt-6 p-6 bg-white/5 rounded-lg border border-white/10 max-w-md mx-auto space-y-3">
              <p className="text-white mb-3">Enter Team Code</p>
              <input
                type="text"
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value)}
                placeholder="e.g., CC2026"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:border-white transition-colors"
              />
              <button
                disabled={busy}
                onClick={() => void handleJoin()}
                className="w-full bg-[#6b0000] hover:bg-[#8b0000] text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                Join
              </button>
            </div>
          )}

          {error && <p className="text-red-300 text-sm mt-4">{error}</p>}
        </div>

        <div className="bg-[#6b0000]/30 border border-white/20 rounded-xl p-6">
          <h3 className="text-white text-lg mb-2 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-white" />
            Team Tips
          </h3>
          <ul className="text-white/90 space-y-2 text-sm">
            <li>• Teams work best with diverse skill sets</li>
            <li>• Communicate your project idea clearly</li>
            <li>• Make sure all members can commit to the full 24 hours</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl sm:text-4xl text-white mb-2">My Team</h1>
        <p className="text-white/80">Collaborate and compete together</p>
      </div>

      {error && <p className="text-red-300 text-sm">{error}</p>}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-[#6b0000]/30 border border-white/20 rounded-xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-2xl text-white mb-2">{myTeam.name}</h3>
              <p className="text-white">Team Code: {myTeam.code}</p>
            </div>
            <button
              disabled={busy}
              onClick={() => void handleLeave()}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <UserMinus className="w-4 h-4" />
              Leave Team
            </button>
          </div>

          <div className="mb-4 bg-amber-950/50 border border-amber-300/50 rounded-lg p-4">
            <p className="text-amber-100">
              All team members must join this team before you submit for judging. Use this exact project name on Devpost.
            </p>
          </div>

          <div className="space-y-3">
            {myTeam.memberEmails.map((email) => {
              const pending = (myTeam.pendingCheckInEmails || []).map((e) => e.toLowerCase());
              const checkedIn = !pending.includes(email.toLowerCase());
              const isYou = email.toLowerCase() === user?.email?.toLowerCase();
              return (
              <div key={email} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#000000] flex items-center justify-center">
                    <span className="text-white">{email.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white">{isYou ? user?.name || email : email}</p>
                    <p className="text-sm text-white/80">{email}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${checkedIn ? 'bg-emerald-900/70 text-emerald-200' : 'bg-white/10 text-white/70'}`}>
                    {checkedIn ? 'Checked in' : 'Not checked in'}
                  </span>
                  {isYou ? (
                    <span className="bg-[#000000] text-white text-xs px-2 py-1 rounded">You</span>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleRemoveTeammate(email)}
                      className="bg-white/10 hover:bg-white/20 text-white text-xs px-2 py-1 rounded disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
              );
            })}
          </div>

          {myTeam.submittedForJudging ? (
            <div className="mt-6 bg-emerald-950/50 border border-emerald-400/40 rounded-lg p-4">
              <p className="text-emerald-200 font-medium">Submitted for judging</p>
              {myTeam.project && (
                <p className="text-white mt-2">Project: {myTeam.project}</p>
              )}
              <p className="text-amber-100 text-sm mt-2">
                Use this exact project name on Devpost.
              </p>
              {myTeam.submittedAt && (
                <p className="text-white/70 text-sm mt-1">
                  {new Date(myTeam.submittedAt).toLocaleString()}
                </p>
              )}
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              <div>
                <label className="block text-white/80 text-sm mb-2">Project name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  maxLength={120}
                  placeholder="Enter the project name"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:border-white transition-colors"
                />
                <p className="text-amber-100 text-sm mt-2">
                  This must be the same project name you use on Devpost.
                </p>
              </div>
              {(myTeam.pendingCheckInEmails || []).length > 0 && (
                <p className="text-amber-200 text-sm">
                  Every member must check in before this team can be submitted for judging.
                </p>
              )}
              <button
                disabled={busy || (myTeam.pendingCheckInEmails || []).length > 0 || !projectName.trim()}
                onClick={() => void handleSubmitForJudging()}
                className="w-full bg-[#6b0000] hover:bg-[#8b0000] text-white px-4 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit for judging
              </button>
            </div>
          )}

          <p className="w-full mt-4 text-white/60 text-sm text-center">
            Share code <span className="font-mono text-white">{myTeam.code}</span> to invite members
          </p>
        </div>

        <div className="bg-[#000000]/30 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <h3 className="text-xl text-white mb-4">Other Teams</h3>
          <div className="space-y-3">
            {otherTeams.length === 0 ? (
              <p className="text-white/60 text-sm">No other teams yet.</p>
            ) : (
              otherTeams.map((team) => (
                <div key={team.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white mb-1">{team.name}</p>
                      <p className="text-sm text-white/80 mb-2">
                        {team.memberEmails.length} members
                      </p>
                      <p className="text-sm text-white/90">{team.project || 'No project yet'}</p>
                    </div>
                    <Users className="w-5 h-5 text-white/50" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResourcesView() {
  const [selectedResource, setSelectedResource] = useState<string | null>(null);

  const resources = [
    {
      id: 'wifi',
      title: 'Wi-Fi',
      icon: Wifi,
      color: 'from-cyan-500 to-cyan-600',
      content: (
        <div className="space-y-6">
          <h2 className="text-3xl text-white mb-2">Guest Wi-Fi</h2>
          <p className="text-white/70">Follow these steps to connect to UCMO-Guest at the event.</p>
          <WifiGuide />
        </div>
      ),
    },
    {
      id: 'sponsors',
      title: 'Sponsors',
      icon: Building2,
      color: 'from-blue-500 to-blue-600',
      content: (
        <div className="space-y-6">
          <h2 className="text-3xl text-white mb-4">Our Sponsors</h2>
          <SponsorCarousel emptyClassName="text-white/70" />
        </div>
      ),
    },
    {
      id: 'schedule',
      title: 'Schedule',
      icon: Calendar,
      color: 'from-green-500 to-green-600',
      content: (
        <div className="space-y-6">
          <h2 className="text-3xl text-white mb-2">Event Schedule</h2>
          <p className="text-white/70">
            {EVENT_VENUE}, {EVENT_CAMPUS}, {EVENT_CITY}
          </p>
          <ScheduleAgenda />
        </div>
      ),
    },
    {
      id: 'prizes',
      title: 'Prizes',
      icon: Trophy,
      color: 'from-red-500 to-red-600',
      content: (
        <div className="space-y-6">
          <h2 className="text-3xl text-white mb-4">Prizes & Awards</h2>
          <div className="bg-white/5 border border-white/10 rounded-lg p-8">
            <p className="text-xl text-white/80">Prizes will be announced at the event.</p>
          </div>
        </div>
      ),
    },
    {
      id: 'faq',
      title: 'FAQ',
      icon: HelpCircle,
      color: 'from-red-500 to-red-600',
      content: (
        <div className="space-y-6">
          <h2 className="text-3xl text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Who can participate?',
                a: 'Any high school or college student is welcome! Whether you\'re a first-time hacker or a seasoned pro, we\'d love to have you.',
              },
              {
                q: 'How much does it cost?',
                a: 'Mule Hacks is completely free! We\'ll provide meals, snacks, swag, and prizes.',
              },
              {
                q: 'What should I bring?',
                a: 'Bring your laptop, charger, and anything else you need to work on your project.',
              },
              {
                q: 'Do I need a team?',
                a: 'Teams can be up to 4 people. You can come with a team or form one at the event. Solo hackers are also welcome!',
              },
              {
                q: 'What can I build?',
                a: 'Anything! Web apps, mobile apps, games, AI/ML projects, developer tools, and more—the sky\'s the limit.',
              },
            ].map((faq, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-red-500/20 hover:border-red-500 transition-all">
                <h3 className="text-lg text-white mb-2">{faq.q}</h3>
                <p className="text-white/80">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  if (selectedResource) {
    const resource = resources.find((r) => r.id === selectedResource);
    if (resource) {
      return (
        <div className="space-y-6 max-w-6xl mx-auto">
          <button
            onClick={() => setSelectedResource(null)}
            className="text-white hover:text-white/80 flex items-center gap-2 transition-colors"
          >
            ← Back to Resources
          </button>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8"
          >
            {resource.content}
          </motion.div>
        </div>
      );
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl sm:text-4xl text-white mb-2">Resources</h1>
        <p className="text-white/80">Quick access to important hackathon information</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource) => (
          <motion.button
            key={resource.id}
            onClick={() => setSelectedResource(resource.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-[#000000]/30 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-center hover:border-white/50 transition-all group"
          >
            <div
              className={`w-16 h-16 rounded-full bg-[#000000] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}
            >
              <resource.icon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg text-white mb-2">{resource.title}</h3>
            <p className="text-sm text-white/80 flex items-center justify-center gap-1">
              View Details
              <ExternalLink className="w-4 h-4" />
            </p>
          </motion.button>
        ))}
      </div>

      <div className="bg-[#000000] rounded-xl p-6">
        <h3 className="text-white text-lg mb-2">Need Help?</h3>
        <p className="text-white/90 mb-4">
          Can't find what you're looking for? Reach out to our team at mulehacks2026@gmail.com
          or join the official Discord.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="mailto:mulehacks2026@gmail.com"
            className="inline-block bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-lg transition-all"
          >
            Contact Support
          </a>
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-lg transition-all"
          >
            Join Discord
          </a>
        </div>
      </div>
    </div>
  );
}

function toProfileUrl(value: string | undefined, baseUrl: string) {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(www\.|github\.com|linkedin\.com)/i.test(trimmed)) return `https://${trimmed}`;
  return `${baseUrl}${trimmed}`;
}

function ProfileView({ user }: { user: any }) {
  const githubUrl = toProfileUrl(user?.github, "https://github.com/");
  const linkedinUrl = toProfileUrl(user?.linkedin, "https://linkedin.com/in/");

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-3xl sm:text-4xl text-white">Profile</h1>
      <div className="bg-[#000000]/30 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-[#000000] flex items-center justify-center">
            <span className="text-3xl text-white">{user?.name?.charAt(0) || 'U'}</span>
          </div>
          <div>
            <h2 className="text-2xl text-white">{user?.name || 'User'}</h2>
            <p className="text-white/80">{user?.email}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-white/80 text-sm mb-1">University</label>
            <p className="text-white">{user?.university || 'Not specified'}</p>
          </div>
          <div>
            <label className="block text-white/80 text-sm mb-1">Major</label>
            <p className="text-white">{user?.major || 'Not specified'}</p>
          </div>
          <div>
            <label className="block text-white/80 text-sm mb-1">Year</label>
            <p className="text-white capitalize">{user?.year || 'Not specified'}</p>
          </div>
          <div>
            <label className="block text-white/80 text-sm mb-1">Phone</label>
            <p className="text-white">{user?.phone || 'Not specified'}</p>
          </div>
          <div>
            <label className="block text-white/80 text-sm mb-1">Dietary Restrictions</label>
            <p className="text-white">{user?.dietaryRestrictions || 'Not specified'}</p>
          </div>
          <div>
            <label className="block text-white/80 text-sm mb-1">T-shirt Size</label>
            <p className="text-white">{user?.shirtSize || 'Not specified'}</p>
          </div>
          {(githubUrl || linkedinUrl) && (
            <div>
              <label className="block text-white/80 text-sm mb-2">Links</label>
              <div className="flex flex-wrap gap-3">
                {githubUrl && (
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-2 transition-colors"
                  >
                    GitHub <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                {linkedinUrl && (
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-2 transition-colors"
                  >
                    LinkedIn <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
