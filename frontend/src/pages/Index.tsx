import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Shield, MessageCircle, Clock, Users, Star } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-purple-100 dark:border-purple-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                InKveiL
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost" className="text-gray-700 dark:text-gray-300">
                  Sign In
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              No Swipes. Real Connections. Pure Intent.
            </Badge>
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Connect with{" "}
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Authentic Intent
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
              InKveiL revolutionizes dating by focusing on genuine connections over superficial swipes. 
              Request meaningful conversations, build authentic relationships, and connect safely.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-3 text-lg">
                  Start Connecting
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-3 text-lg border-purple-300 text-purple-700 hover:bg-purple-50">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why InKveiL is Different
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Built for meaningful connections with safety and respect at the core
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-purple-100 dark:border-purple-800 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                  <MessageCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Request-Based Connections
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  No mindless swiping. Send thoughtful connection requests based on profiles, not just photos.
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-100 dark:border-purple-800 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  24-Hour Chat Windows
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  When someone accepts your request, you get 24 hours to start a meaningful conversation.
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-100 dark:border-purple-800 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Privacy & Safety First
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Anonymous profiles, end-to-end encryption, and no exploitation. Your safety matters.
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-100 dark:border-purple-800 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900 rounded-lg flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Intent-Driven Matching
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Focus on bios, interests, and intentions rather than superficial judgments.
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-100 dark:border-purple-800 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Premium Group Rooms
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Join curated group discussions and events with verified premium members.
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-100 dark:border-purple-800 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900 rounded-lg flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No Gamification
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  No karma scores or ratings. Just authentic human connections without the games.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-r from-purple-600 to-pink-600 border-0 text-white">
            <CardContent className="p-8 sm:p-12 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready for Real Connections?
              </h2>
              <p className="text-xl text-purple-100 mb-8">
                Join thousands who've found meaningful relationships through authentic intent.
              </p>
              <Link to="/signup">
                <Button size="lg" variant="secondary" className="px-8 py-3 text-lg bg-white text-purple-600 hover:bg-purple-50">
                  Get Started Free
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-purple-200 dark:border-purple-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                InKveiL
              </span>
            </div>
            <div className="flex space-x-6 text-sm text-gray-600 dark:text-gray-400">
              <Link to="/privacy" className="hover:text-purple-600 dark:hover:text-purple-400">Privacy</Link>
              <Link to="/terms" className="hover:text-purple-600 dark:hover:text-purple-400">Terms</Link>
              <Link to="/support" className="hover:text-purple-600 dark:hover:text-purple-400">Support</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-purple-200 dark:border-purple-800 text-center text-sm text-gray-600 dark:text-gray-400">
            © 2024 InKveiL. Building authentic connections with intent and respect.
          </div>
        </div>
      </footer>
    </div>
  );
}
