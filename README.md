# Jervi Counts Ur Dev Time

**Track your coding flow. Automatically.**

Jervi Counts Ur Dev Time is a comprehensive developer productivity tool that integrates directly with VS Code to log your programming activity. Visualize your habits, identify peak productivity hours, and compete on the global leaderboard.

## 🚀 Features

- **Automated Time Tracking**: Seamlessly tracks your coding activity directly from VS Code.
- **Detailed Analytics**: View your daily, weekly, and monthly coding stats.
- **Leaderboard**: Compete with other developers and see who codes the most (or who has no life... just kidding!).
- **Language Breakdown**: See which languages you use the most.
- **Modern Dashboard**: A beautiful, responsive dashboard built with Next.js and Tailwind CSS.
- **Antigravity Compatible**: Instructions included for running in Antigravity environments.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database**: [PostgreSQL (Neon)](https://neon.tech/) / [Supabase](https://supabase.com/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🏁 Getting Started

Follow these steps to get the project running locally.

### Prerequisites

- Node.js 18+ installed on your machine.
- A Supabase project set up.

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/jervi-sir/jervi-counts-ur-dev-time.git
    cd jervi-counts-ur-dev-time
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Environment Setup:**

    Copy the example environment file and update it with your credentials:

    ```bash
    cp .env.example .env
    ```

    Update `.env` with your Keys:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key
    DATABASE_URL="postgres://..."
    ```

4.  **Database Setup:**

    Generate and push the migrations to your database:

    ```bash
    npm run db:generate
    npm run db:migrate
    ```

5.  **Run the Development Server:**

    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🧩 VS Code Extension

The VS Code extension source code is located in the `z-extension` directory.

To install the extension:
1.  Visit the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=jervi-sir.jervi-counts-ur-dev-time).
2.  Or search for `jervi-counts-ur-dev-time` in the Extensions view (`Ctrl+Shift+X`).

For local development of the extension, refer to `z-extension/README.md`.

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 👏 Acknowledgments

- Built by [Jervi-sir](https://github.com/jervi-sir)
- Inspired by the need to know if I'm working hard or hardly working.
