<div align="center">
<img width="1885" height="910" alt="Screenshot 2026-01-02 154916" src="https://github.com/user-attachments/assets/02b1d76c-8948-4b2a-be81-a86cfcd39679" />

</div>

# MADChain - Decentralized Invoice Marketplace

**Transforming Working Capital Access for India's MSMEs**

MADChain is a blockchain-powered invoice financing platform that helps Indian small and medium enterprises unlock immediate liquidity from their unpaid invoices. We bridge the gap between MSMEs waiting for corporate payments and investors seeking asset-backed returns.

## The Problem We're Solving

MSMEs in India face a critical cash flow challenge. After delivering goods or services to large corporations, they often wait 30-90 days for payment. During this period, they struggle to pay salaries, purchase raw materials, or take on new orders - stunting their growth despite having legitimate business.

Traditional banks are hesitant to provide working capital loans to smaller businesses due to high risk assessment costs and lack of credit history. This forces MSMEs into expensive informal lending or missed opportunities.

## Our Solution

MADChain tokenizes unpaid invoices as NFTs on the blockchain, creating a transparent marketplace where MSMEs can get paid immediately while investors earn competitive returns by funding verified receivables.

### How It Works

1. **MSME Creates Invoice NFT** - Business owners upload their unpaid invoice and buyer details
2. **AI Risk Analysis** - Our MADTech AI engine analyzes the buyer's payment history, GST records, and financial standing
3. **Marketplace Listing** - Verified invoices are listed with transparent risk scores and suggested interest rates
4. **Investor Funding** - Investors browse opportunities and fund invoices they're comfortable with
5. **Automatic Settlement** - When the corporate buyer pays, smart contracts automatically distribute principal + interest to investors

## Key Features

- **Instant Liquidity**: MSMEs receive 80-90% of invoice value within hours instead of waiting months
- **Transparent Risk Scoring**: AI-powered analysis of buyer creditworthiness using GST data and payment patterns
- **Decentralized Security**: Smart contracts ensure funds are held securely and distributed automatically
- **Investor Access**: Retail investors can participate in trade finance previously limited to institutions
- **Blockchain Verification**: Every transaction is immutable and auditable on Polygon network

## Tech Stack

- **Frontend**: React 19 + TypeScript for a modern, responsive interface
- **Blockchain**: Polygon/EVM for low-cost, fast transactions
- **Smart Contracts**: Solidity-based NFT minting and escrow mechanisms
- **AI Engine**: MADTech powered risk assessment and credit scoring
- **Build Tool**: Vite for lightning-fast development

## Getting Started Locally

You'll need Node.js installed on your machine.

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd madchain---decentralized-invoice-marketplace
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API Access**
   - Create a `.env.local` file in the root directory
   - Add your Gemini API key:
     ```
     Gemini_API_KEY=your_api_key_here
     ```
   - You can obtain an API key from the MADTech dashboard

4. **Start the development server**
   ```bash
   npm run dev
   ```

The application will open in your browser at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The optimized production build will be in the `dist/` folder.

## User Roles

### For MSMEs (Invoice Issuers)
- Mint your unpaid invoices as NFTs
- Get instant risk assessment and suggested rates
- List on marketplace to attract funding
- Receive immediate working capital

### For Investors
- Browse verified invoices with transparent risk metrics
- Fund receivables from established Indian corporates
- Earn 10-18% APY on verified trade receivables
- Automatic repayment when buyer settles

## Protocol Architecture

**Tokenization Layer**: Invoices are minted as ERC-721 NFTs containing encrypted metadata including GSTIN, buyer information, and invoice hash.

**AI Oracle**: MADTech AI analyzes corporate credit histories, GST compliance records, and macroeconomic indicators to generate real-time risk scores.

**Escrow Mechanism**: Investor funds are locked in MAD-Vault smart contracts and only released when conditions are met.

**Settlement Logic**: Automatic distribution of principal + interest when corporate buyer settles through the protocol gateway.

## Current Development Status

This is an MVP (Minimum Viable Product) built for the East India Blockchain Summit 2.0 hackathon. The platform currently operates on Polygon testnet with simulated data for demonstration purposes.

**Next Steps:**
- Integration with real GST verification APIs
- Multi-chain support (Ethereum, BSC)
- Mobile app for on-the-go invoice management
- Advanced portfolio analytics for investors
- Integration with traditional banking systems

## Security Considerations

- Smart contracts handle all fund transfers - no centralized custody
- Invoice documents are stored with IPFS hashing for immutability
- Private keys remain with users - we never access your wallet
- Risk scores are deterministic and verifiable on-chain

## Contributing

We welcome contributions from the community! Whether it's bug fixes, feature additions, or documentation improvements, feel free to open a pull request.

## Team

Developed by MADChain team for EIBS 2.0 Hackathon

## License

MIT License - See LICENSE file for details

---

**Note**: This is a prototype for demonstration and innovation purposes. Do not use with real funds on mainnet without comprehensive security audits.
