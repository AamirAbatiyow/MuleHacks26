import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { SeoHead } from '../components/SeoHead';
import { User, GraduationCap, BookOpen, Phone, Github, Linkedin, ChevronRight, FileText } from 'lucide-react';
import {
  RegistrationQuestions,
  registrationAnswersComplete,
  type StudentLevel,
  type TeamPreference,
} from '../components/RegistrationQuestions';

const TOTAL_STEPS = 6;

export function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    university: 'University of Central Missouri',
    major: '',
    year: '',
    phone: '',
    dietaryRestrictions: '',
    shirtSize: '',
    github: '',
    linkedin: '',
    studentLevel: '',
    teamPreference: '',
    rulesAcknowledged: false,
  });
  const { updateUserProfile } = useAuth();
  const navigate = useNavigate();

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = async () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      return;
    }

    try {
      await updateUserProfile({
        name: formData.name,
        university: formData.university,
        major: formData.major,
        year: formData.year,
        phone: formData.phone,
        dietaryRestrictions: formData.dietaryRestrictions,
        shirtSize: formData.shirtSize,
        github: formData.github,
        linkedin: formData.linkedin,
        studentLevel: formData.studentLevel as StudentLevel,
        teamPreference: formData.teamPreference as TeamPreference,
        rulesAcknowledged: true,
        hasCompletedOnboarding: true,
      });
      navigate('/dashboard');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save profile');
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.name.trim() !== '';
      case 2:
        return formData.university.trim() !== '';
      case 3:
        return formData.major.trim() !== '' && formData.year !== '';
      case 4:
        return (
          formData.phone.trim() !== '' &&
          formData.dietaryRestrictions.trim() !== '' &&
          formData.shirtSize !== ''
        );
      case 5:
        return true;
      case 6:
        return registrationAnswersComplete(
          formData.rulesAcknowledged,
          formData.studentLevel,
          formData.teamPreference
        );
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-brand flex items-center justify-center px-4 py-8">
      <SeoHead
        title="Onboarding | Mule Hacks 2026"
        description="Complete your Mule Hacks 2026 registration profile."
        noIndex
      />
      <div className="w-full max-w-lg relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/30 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl"
        >
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-white/80">Step {step} of {TOTAL_STEPS}</span>
              <span className="text-sm text-white/80">{Math.round((step / TOTAL_STEPS) * 100)}%</span>
            </div>
            <div className="h-2 bg-black/30 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                transition={{ duration: 0.3 }}
                className="h-full bg-black"
              />
            </div>
          </div>

          {/* Step Content */}
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {step === 1 && (
              <div>
                <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center mx-auto mb-6">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl text-white text-center mb-3">What's your name?</h2>
                <p className="text-white/80 text-center mb-8">
                  Let's get to know you better
                </p>
                <div>
                  <label className="block text-white/90 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-white transition-colors"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center mx-auto mb-6">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl text-white text-center mb-3">What university do you attend?</h2>
                <p className="text-white/80 text-center mb-8">
                  We welcome students from all universities
                </p>
                <div>
                  <label className="block text-white/90 mb-2">University</label>
                  <input
                    type="text"
                    value={formData.university}
                    onChange={(e) => handleChange('university', e.target.value)}
                    placeholder="University of Central Missouri"
                    className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-white transition-colors"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl text-white text-center mb-3">Tell us about your studies</h2>
                <p className="text-white/80 text-center mb-8">
                  This helps us personalize your experience
                </p>
                <div className="space-y-6">
                  <div>
                    <label className="block text-white/90 mb-2">Major / Field of Study</label>
                    <input
                      type="text"
                      value={formData.major}
                      onChange={(e) => handleChange('major', e.target.value)}
                      placeholder="Computer Science"
                      className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-white transition-colors"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-white/90 mb-2">Year</label>
                    <select
                      value={formData.year}
                      onChange={(e) => handleChange('year', e.target.value)}
                      className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
                    >
                      <option value="" className="bg-gray-900">Select your year</option>
                      <option value="freshman" className="bg-gray-900">Freshman</option>
                      <option value="sophomore" className="bg-gray-900">Sophomore</option>
                      <option value="junior" className="bg-gray-900">Junior</option>
                      <option value="senior" className="bg-gray-900">Senior</option>
                      <option value="graduate" className="bg-gray-900">Graduate Student</option>
                      <option value="other" className="bg-gray-900">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center mx-auto mb-6">
                  <Phone className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl text-white text-center mb-3">A few event details</h2>
                <p className="text-white/80 text-center mb-8">
                  This helps organizers plan food, shirts, and check-in
                </p>
                <div className="space-y-6">
                  <div>
                    <label className="block text-white/90 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="(555) 123-4567"
                      className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-white transition-colors"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-white/90 mb-2">Dietary Restrictions</label>
                    <input
                      type="text"
                      value={formData.dietaryRestrictions}
                      onChange={(e) => handleChange('dietaryRestrictions', e.target.value)}
                      placeholder="e.g. None, Vegetarian, Nut allergy"
                      className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-white/90 mb-2">T-shirt Size</label>
                    <select
                      value={formData.shirtSize}
                      onChange={(e) => handleChange('shirtSize', e.target.value)}
                      className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
                    >
                      <option value="" className="bg-gray-900">Select your size</option>
                      <option value="XS" className="bg-gray-900">XS</option>
                      <option value="S" className="bg-gray-900">S</option>
                      <option value="M" className="bg-gray-900">M</option>
                      <option value="L" className="bg-gray-900">L</option>
                      <option value="XL" className="bg-gray-900">XL</option>
                      <option value="XXL" className="bg-gray-900">XXL</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div>
                <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center mx-auto mb-6">
                  <div className="flex gap-1">
                    <Github className="w-7 h-7 text-white" />
                    <Linkedin className="w-7 h-7 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl text-white text-center mb-3">Add your socials</h2>
                <p className="text-white/80 text-center mb-8">
                  Optional, but helpful for teammates and organizers
                </p>
                <div className="space-y-6">
                  <div>
                    <label className="block text-white/90 mb-2">GitHub (optional)</label>
                    <input
                      type="text"
                      value={formData.github}
                      onChange={(e) => handleChange('github', e.target.value)}
                      placeholder="https://github.com/username"
                      className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-white transition-colors"
                      autoFocus
                    />
                    <p className="text-white/60 text-xs mt-2">
                      URL preferred (e.g. https://github.com/you), but a username works too.
                    </p>
                  </div>
                  <div>
                    <label className="block text-white/90 mb-2">LinkedIn (optional)</label>
                    <input
                      type="text"
                      value={formData.linkedin}
                      onChange={(e) => handleChange('linkedin', e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-white transition-colors"
                    />
                    <p className="text-white/60 text-xs mt-2">
                      URL preferred (e.g. https://linkedin.com/in/you), but a username works too.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === 6 && (
              <div>
                <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl text-white text-center mb-3">Rules and your plans</h2>
                <p className="text-white/80 text-center mb-8">
                  Confirm the rules and tell us about your student status and team
                </p>
                <RegistrationQuestions
                  rulesAcknowledged={formData.rulesAcknowledged}
                  studentLevel={formData.studentLevel}
                  teamPreference={formData.teamPreference}
                  onRulesChange={(value) =>
                    setFormData((prev) => ({ ...prev, rulesAcknowledged: value }))
                  }
                  onStudentLevelChange={(value) =>
                    setFormData((prev) => ({ ...prev, studentLevel: value }))
                  }
                  onTeamPreferenceChange={(value) =>
                    setFormData((prev) => ({ ...prev, teamPreference: value }))
                  }
                />
              </div>
            )}
          </motion.div>

          {/* Navigation Buttons */}
          <div className="mt-8 flex gap-4">
            {step > 1 && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setStep(step - 1)}
                className="flex-1 bg-black/30 border border-white/20 text-white py-3 rounded-lg hover:bg-black/40 transition-all"
              >
                Back
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 bg-[#6b0000] hover:bg-[#8b0000] text-white py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(107,0,0,0.5),0_0_40px_rgba(107,0,0,0.3),0_0_60px_rgba(107,0,0,0.2)] hover:shadow-[0_0_30px_rgba(139,0,0,0.6),0_0_60px_rgba(139,0,0,0.4),0_0_80px_rgba(139,0,0,0.3)] flex items-center justify-center gap-2"
            >
              {step === TOTAL_STEPS ? 'Complete' : 'Next'}
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
