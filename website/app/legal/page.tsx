export const metadata = {
  title: "Legal Disclaimer | TARCOIN",
  description: "Legal Disclaimer and Terms of Use for the Tarcoin Network.",
};

export default function LegalDisclaimer() {
  return (
    <div className="min-h-screen pt-32 pb-20 relative z-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-white mb-8">
          Legal <span className="text-tarcoin-gold">Disclaimer</span>
        </h1>
        
        <div className="prose prose-invert prose-gold max-w-none space-y-6 text-gray-300">
          <section className="bg-tarcoin-black-2 p-8 rounded-xl border border-tarcoin-gold/10">
            <h2 className="text-2xl font-orbitron font-bold text-tarcoin-gold mb-4">1. Information published on tarcoin.org</h2>
            <p>
              The website https://tarcoin.org/ (hereinafter, referred to as the &quot;Website&quot;) provides information and material of a general nature. You are not authorized and nor should you rely on the Website for legal advice, business advice, or advice of any kind. You act at your own risk in reliance on the contents of the Website. Should you make a decision to act or not act you should contact a licensed attorney in the relevant jurisdiction in which you want or need help. In no way are the contributors to the Website responsible for the actions, decisions, or other behavior taken or not taken by you in reliance upon the Website.
            </p>
          </section>

          <section className="bg-tarcoin-black-2 p-8 rounded-xl border border-tarcoin-gold/10">
            <h2 className="text-2xl font-orbitron font-bold text-tarcoin-gold mb-4">2. Translations</h2>
            <p>
              The Website may contain translations of the English version of the content available on the Website. These translations are provided only as a convenience. In the event of any conflict between the English language version and the translated version, the English language version shall take precedence. If you notice any inconsistency, please report them on the official GitHub.
            </p>
          </section>

          <section className="bg-tarcoin-black-2 p-8 rounded-xl border border-tarcoin-gold/10">
            <h2 className="text-2xl font-orbitron font-bold text-tarcoin-gold mb-4">3. Risks related to the use of Tarcoin</h2>
            <p>The Website will not be responsible for any losses, damages or claims arising from events falling within the scope of the following five categories:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4 text-gray-400">
              <li>Mistakes made by the user of any Tarcoin-related software or service, e.g., forgotten passwords, payments sent to wrong Tarcoin addresses, and accidental deletion of wallets.</li>
              <li>Software problems of the Website and/or any Tarcoin-related software or service, e.g., corrupted wallet file, incorrectly constructed transactions, unsafe cryptographic libraries, malware affecting the Website and/or any Tarcoin-related software or service.</li>
              <li>Technical failures in the hardware of the user of any Tarcoin-related software or service, e.g., data loss due to a faulty or damaged storage device.</li>
              <li>Security problems experienced by the user of any Tarcoin-related software or service, e.g., unauthorized access to users&apos; wallets and/or accounts.</li>
              <li>Actions or inactions of third parties and/or events experienced by third parties, e.g., bankruptcy of service providers, information security attacks on service providers, and fraud conducted by third parties.</li>
            </ul>
          </section>

          <section className="bg-tarcoin-black-2 p-8 rounded-xl border border-tarcoin-gold/10">
            <h2 className="text-2xl font-orbitron font-bold text-tarcoin-gold mb-4">4. Investment risks</h2>
            <p>
              The investment in Tarcoin can lead to loss of money over short or even long periods. The investors in Tarcoin should expect prices to have large range fluctuations. The information published on the Website cannot guarantee that the investors in Tarcoin would not lose money.
            </p>
          </section>

          <section className="bg-tarcoin-black-2 p-8 rounded-xl border border-tarcoin-gold/10">
            <h2 className="text-2xl font-orbitron font-bold text-tarcoin-gold mb-4">5. Compliance with tax obligations</h2>
            <p>
              The users of the Website are solely responsible to determinate what, if any, taxes apply to their Tarcoin transactions. The contributors to the Website are NOT responsible for determining the taxes that apply to Tarcoin transactions.
            </p>
          </section>

          <section className="bg-tarcoin-black-2 p-8 rounded-xl border border-tarcoin-gold/10">
            <h2 className="text-2xl font-orbitron font-bold text-tarcoin-gold mb-4">6. The Website does not store, send, or receive tarcoins</h2>
            <p>
              The Website does not store, send or receive tarcoins. This is because tarcoins exist only by virtue of the ownership record maintained in the Tarcoin network. Any transfer of title in tarcoins occurs within a decentralized Tarcoin network, and not on the Website.
            </p>
          </section>

          <section className="bg-tarcoin-black-2 p-8 rounded-xl border border-tarcoin-gold/10">
            <h2 className="text-2xl font-orbitron font-bold text-tarcoin-gold mb-4">7. No warranties</h2>
            <p>
              The Website is provided on an &quot;as is&quot; basis without any warranties of any kind regarding the Website and/or any content, data, materials and/or services provided on the Website.
            </p>
          </section>

          <section className="bg-tarcoin-black-2 p-8 rounded-xl border border-tarcoin-gold/10">
            <h2 className="text-2xl font-orbitron font-bold text-tarcoin-gold mb-4">8. Limitation of liability</h2>
            <p>
              Unless otherwise required by law, in no event shall the contributors to the Website be liable for any damages of any kind, including, but not limited to, loss of use, loss of profits, or loss of data arising out of or in any way connected with the use of the Website.
            </p>
          </section>

          <section className="bg-tarcoin-black-2 p-8 rounded-xl border border-tarcoin-gold/10">
            <h2 className="text-2xl font-orbitron font-bold text-tarcoin-gold mb-4">9. Arbitration</h2>
            <p>
              The user of the Website agrees to arbitrate any dispute arising from or in connection with the Website or this disclaimer, except for disputes related to copyrights, logos, trademarks, trade names, trade secrets or patents.
            </p>
          </section>

          <section className="bg-tarcoin-black-2 p-8 rounded-xl border border-tarcoin-gold/10">
            <h2 className="text-2xl font-orbitron font-bold text-tarcoin-gold mb-4">10. Last amendment</h2>
            <p>
              This disclaimer was last amended on {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
