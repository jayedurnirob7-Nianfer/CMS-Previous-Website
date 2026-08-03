import './globals.css'

export const metadata = {
  title: 'CMS Previous Website',
  description: 'Manage your website entries easily',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
