const STEPS = [
  {
    title: "Choose UCMO-Guest",
    body: "On your device, open the list of available wireless networks and select UCMO-Guest.",
  },
  {
    title: "Create a Guest User ID",
    body: 'When your device opens the guest login page, click "Don\'t have a Guest User ID?" at the bottom of the page.',
  },
  {
    title: "Register with your email",
    body: "Enter a valid email address on the registration page. Your Guest User ID is that email address. A password will be sent to the email you provide.",
  },
] as const;

export function WifiGuide() {
  return (
    <div className="space-y-4">
      {STEPS.map((step, index) => (
        <div
          key={step.title}
          className="bg-white/5 border border-white/10 rounded-lg p-6"
        >
          <p className="text-white/50 text-xs uppercase tracking-wider mb-2">
            Step {index + 1}
          </p>
          <h3 className="text-xl text-white mb-2">{step.title}</h3>
          <p className="text-white/80">{step.body}</p>
        </div>
      ))}
    </div>
  );
}
