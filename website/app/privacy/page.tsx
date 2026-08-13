export const metadata = {
  title: "Privacy Policy | TARCOIN",
  description: "Privacy Policy and Data Collection Practices for the Tarcoin Network.",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen pt-32 pb-20 relative z-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-white mb-8">
          Privacy <span className="text-tarcoin-gold">Policy</span>
        </h1>
        
        <div className="prose prose-invert prose-gold max-w-none space-y-6 text-gray-300">
          <p className="text-lg">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <section className="bg-tarcoin-black-2 p-8 rounded-xl border border-tarcoin-gold/10">
            <h2 className="text-2xl font-orbitron font-bold text-tarcoin-gold mb-4">1. Introduction</h2>
            <p>
              Tarcoin is an open-source, decentralized cryptocurrency project. The Tarcoin.org website (&quot;Website&quot;) is maintained by community developers to provide information and resources about the Tarcoin network. This Privacy Policy explains how information is collected, used, and protected when you visit this Website.
            </p>
          </section>

          <section className="bg-tarcoin-black-2 p-8 rounded-xl border border-tarcoin-gold/10">
            <h2 className="text-2xl font-orbitron font-bold text-tarcoin-gold mb-4">2. The Public Blockchain</h2>
            <p>
              Please remember that the Tarcoin network is a public, decentralized blockchain. 
              <strong> Any transactions you make, balances you hold, or data you publish to the Tarcoin blockchain are permanently and publicly visible to anyone in the world. </strong>
              This Website has no control over the blockchain network and cannot modify, delete, or hide any information stored on the blockchain ledger.
            </p>
          </section>

          <section className="bg-tarcoin-black-2 p-8 rounded-xl border border-tarcoin-gold/10">
            <h2 className="text-2xl font-orbitron font-bold text-tarcoin-gold mb-4">3. Information Collected</h2>
            <p>When the Website or the Tarcoin Block Explorer is visited, the hosting web servers automatically log standard technical information, including:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4 text-gray-400">
              <li>IP address</li>
              <li>Browser type and version</li>
              <li>Operating system</li>
              <li>Date and time of visit</li>
              <li>Pages viewed and search queries (e.g., searching for a transaction on the Explorer)</li>
            </ul>
            <p className="mt-4">
              This data is collected solely for security purposes, preventing DDoS attacks, and ensuring the stability of community infrastructure (such as mining pools and block explorer nodes).
            </p>
          </section>

          <section className="bg-tarcoin-black-2 p-8 rounded-xl border border-tarcoin-gold/10">
            <h2 className="text-2xl font-orbitron font-bold text-tarcoin-gold mb-4">4. Personal Data</h2>
            <p>
              Users are <strong>not</strong> required to register, create an account, or provide personal information (such as a name, email address, or phone number) to use the Tarcoin website, download the wallet, or mine Tarcoin. Server logs are never sold, rented, or traded to third parties.
            </p>
          </section>

          <section className="bg-tarcoin-black-2 p-8 rounded-xl border border-tarcoin-gold/10">
            <h2 className="text-2xl font-orbitron font-bold text-tarcoin-gold mb-4">5. Cookies</h2>
            <p>
              This Website may use minimal cookies necessary for core functionality (such as remembering your dark mode preference). We do not use intrusive third-party tracking cookies or advertising networks.
            </p>
          </section>

          <section className="bg-tarcoin-black-2 p-8 rounded-xl border border-tarcoin-gold/10">
            <h2 className="text-2xl font-orbitron font-bold text-tarcoin-gold mb-4">6. Changes to this Policy</h2>
            <p>
              This Privacy Policy may be updated periodically to reflect changes in community infrastructure or legal requirements. Visitors are encouraged to review this page for the latest information on privacy practices.
            </p>
          </section>

          <section className="bg-tarcoin-black-2 p-8 rounded-xl border border-tarcoin-gold/10">
            <h2 className="text-2xl font-orbitron font-bold text-tarcoin-gold mb-4">7. Contact</h2>
            <p>
              For any questions about this Privacy Policy, the Tarcoin community can be reached via the official <a href="https://discord.gg/QXm4CxDzJC" className="text-tarcoin-gold hover:underline">Discord</a> or <a href="https://github.com/tarcoin" className="text-tarcoin-gold hover:underline">GitHub</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
