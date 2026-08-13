import { 
  BsShieldCheck, 
  BsExclamationTriangle, 
  BsKey, 
  BsEyeSlash, 
  BsArrowReturnLeft, 
  BsClock, 
  BsGraphUp, 
  BsTools, 
  BsCash 
} from "react-icons/bs";

export const metadata = {
  title: "Things You Need To Know | TARCOIN",
  description: "Essential information and best practices for using the Tarcoin network.",
};

const INFO_CARDS = [
  {
    title: "Securing your wallet",
    icon: BsShieldCheck,
    content: "Like in real life, your wallet must be secured. Tarcoin makes it possible to transfer value anywhere in a very easy way and it allows you to be in control of your money. Such great features also come with great security concerns. At the same time, Tarcoin can provide very high levels of security if used correctly. Always remember that it is your responsibility to adopt good practices in order to protect your money."
  },
  {
    title: "There is no undo button",
    icon: BsExclamationTriangle,
    content: "Tarcoin has no central authority to reverse a mistake. If you permanently lose access to your wallet—for example by losing your recovery phrase—your funds are gone permanently. No one—not developers, miners, wallet providers, or exchanges—can recover funds that you permanently lose from a self-custodied wallet. Always back up your wallet and keep your recovery information safe and private."
  },
  {
    title: "You are your own bank",
    icon: BsKey,
    content: "When you hold your own private keys, you control your tarcoin—but you are also responsible for keeping it secure. If you leave your coins with an exchange or another custodian, you rely on that third party to safeguard them and to honor withdrawals. That reliance introduces counterparty risk: the custodian's own security, solvency, and policies now stand between you and your funds. Holding your own keys removes that risk, but requires you to secure your wallet and backups yourself."
  },
  {
    title: "Tarcoin is not anonymous",
    icon: BsEyeSlash,
    content: "Some effort is required to protect your privacy with Tarcoin. All Tarcoin transactions are stored publicly and permanently on the network, which means anyone can see the balance and transactions of any Tarcoin address. However, the identity of the user behind an address remains unknown until information is revealed during a purchase or in other circumstances. This is one reason why Tarcoin addresses should ideally be used once."
  },
  {
    title: "Tarcoin payments are irreversible",
    icon: BsArrowReturnLeft,
    content: "A Tarcoin transaction cannot be reversed, it can only be refunded by the person receiving the funds. This means you should take care to do business with people and organizations you know and trust, or who have an established reputation. For their part, businesses need to keep track of the payment requests they are displaying to their customers. Tarcoin can detect typos and usually won't let you send money to an invalid address by mistake."
  },
  {
    title: "Unconfirmed transactions aren't secure",
    icon: BsClock,
    content: "Transactions do not become irreversible immediately. Instead, they accumulate confirmations, each making them increasingly difficult to reverse. New blocks are added to the blockchain approximately every 10 minutes on average, but block discovery is probabilistic. If the transaction pays a fee below what the network is currently prioritizing, the first confirmation may take considerably longer."
  },
  {
    title: "Tarcoin price is volatile",
    icon: BsGraphUp,
    content: "The price of a tarcoin can unpredictably increase or decrease over a short period of time due to its young economy, evolving adoption, and sometimes illiquid markets. Tarcoin should be treated as a high-risk asset, and you should never store money that you cannot afford to lose in tarcoin."
  },
  {
    title: "Tarcoin is an evolving project",
    icon: BsTools,
    content: "Tarcoin continues to evolve through active development by the community. Improvements make the network more capable, but can also introduce new challenges as adoption grows. During these growing pains you might encounter increased fees or slower confirmations. Be prepared for problems and consult technical documentation before making any major decisions."
  },
  {
    title: "Government taxes and regulations",
    icon: BsCash,
    content: "Tarcoin is a decentralized cryptocurrency. That said, most jurisdictions still require you to pay income, sales, payroll, and capital gains taxes on anything that has value, including tarcoins. It is your responsibility to ensure that you adhere to tax and other legal or regulatory mandates issued by your government and/or local municipalities."
  }
];

export default function YouNeedToKnow() {
  return (
    <div className="min-h-screen pt-32 pb-20 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-white mb-6">
            Things You <span className="text-tarcoin-gold">Need To Know</span>
          </h1>
          <p className="text-lg text-gray-400">
            If you&apos;re getting started with Tarcoin, there are a few things you should know. Tarcoin lets you exchange money and transact in a different way than you normally do. As such, you should take time to inform yourself before using Tarcoin for any serious transaction. Tarcoin should be treated with the same care as your regular wallet, or even more in some cases!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {INFO_CARDS.map((card, index) => (
            <div 
              key={index} 
              className="bg-tarcoin-black-2 p-8 rounded-xl border border-tarcoin-gold/10 hover:border-tarcoin-gold/30 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-tarcoin-gold/5 flex flex-col h-full"
            >
              <div className="w-14 h-14 rounded-full bg-tarcoin-gold/10 flex items-center justify-center mb-6">
                <card.icon className="w-8 h-8 text-tarcoin-gold" />
              </div>
              <h2 className="text-xl font-orbitron font-bold text-white mb-4">
                {card.title}
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed flex-grow">
                {card.content}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-tarcoin-gold/5 border border-tarcoin-gold/20 rounded-2xl p-8 text-center max-w-4xl mx-auto">
          <h3 className="text-2xl font-orbitron font-bold text-tarcoin-gold mb-4">Confirmation Security Matrix</h3>
          <div className="overflow-x-auto mt-6">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs text-tarcoin-gold uppercase bg-tarcoin-black-3">
                <tr>
                  <th className="px-6 py-4 rounded-tl-lg">Confirmations</th>
                  <th className="px-6 py-4">Security Level</th>
                  <th className="px-6 py-4 rounded-tr-lg">Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tarcoin-gold/10">
                <tr className="bg-tarcoin-black-2">
                  <td className="px-6 py-4 font-bold">0</td>
                  <td className="px-6 py-4 text-red-400">Not Secure</td>
                  <td className="px-6 py-4">Only safe if you deeply trust the sender</td>
                </tr>
                <tr className="bg-tarcoin-black-2">
                  <td className="px-6 py-4 font-bold">1</td>
                  <td className="px-6 py-4 text-yellow-500">Somewhat Reliable</td>
                  <td className="px-6 py-4">Fine for small, low-risk transactions</td>
                </tr>
                <tr className="bg-tarcoin-black-2">
                  <td className="px-6 py-4 font-bold">3</td>
                  <td className="px-6 py-4 text-green-400">Mostly Reliable</td>
                  <td className="px-6 py-4">Standard security for most transactions</td>
                </tr>
                <tr className="bg-tarcoin-black-2">
                  <td className="px-6 py-4 font-bold">6</td>
                  <td className="px-6 py-4 text-green-500">Highly Reliable</td>
                  <td className="px-6 py-4">Minimum recommendation for high-value transfers</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
