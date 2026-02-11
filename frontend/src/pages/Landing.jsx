import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Smartphone, Laptop, Tablet, DollarSign, Clock, TrendingUp } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          {/* Logo */}
          <div className="text-6xl font-bold mb-6">
            <span className="text-gray-800">tr</span>
            <span className="text-primary-600">AI</span>
            <span className="text-gray-800">n</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Earn Money by
            <br />
            <span className="text-primary-600">Training AI</span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Use your phone, tablet, or laptop to complete AI training tasks.
            Get paid for helping companies build better AI models.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              to="/register"
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors"
            >
              Start Earning Now
            </Link>
            <Link
              to="/login"
              className="bg-white hover:bg-gray-50 text-primary-600 font-semibold px-8 py-4 rounded-lg text-lg border-2 border-primary-600 transition-colors"
            >
              Sign In
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-primary-600">50K+</div>
              <div className="text-gray-600">Active Trainers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-600">$2M+</div>
              <div className="text-gray-600">Paid Out</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-600">1M+</div>
              <div className="text-gray-600">Tasks Completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-6">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="text-primary-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Choose Tasks</h3>
              <p className="text-gray-600">
                Browse available AI training tasks like image labeling, text classification, and more.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="text-primary-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Complete Work</h3>
              <p className="text-gray-600">
                Work at your own pace. Most tasks take just 2-10 minutes to complete.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="text-primary-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Paid</h3>
              <p className="text-gray-600">
                Earn $0.15 - $2.00 per task. Withdraw your earnings anytime via Stripe.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Devices Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Work From Any Device
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm text-center">
              <Smartphone className="mx-auto mb-4 text-primary-600" size={48} />
              <h3 className="text-xl font-semibold mb-2">Phone</h3>
              <p className="text-gray-600">
                Train AI on the go from your smartphone
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm text-center">
              <Tablet className="mx-auto mb-4 text-primary-600" size={48} />
              <h3 className="text-xl font-semibold mb-2">Tablet</h3>
              <p className="text-gray-600">
                Perfect for image labeling and detailed work
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm text-center">
              <Laptop className="mx-auto mb-4 text-primary-600" size={48} />
              <h3 className="text-xl font-semibold mb-2">Laptop</h3>
              <p className="text-gray-600">
                Maximum productivity for complex tasks
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Why Choose trAIn?
          </h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex items-start space-x-4">
              <div className="bg-green-100 p-2 rounded-lg">
                <TrendingUp className="text-green-600" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Flexible Schedule</h3>
                <p className="text-gray-600">Work whenever you want, wherever you are</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-green-100 p-2 rounded-lg">
                <DollarSign className="text-green-600" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Fair Payment</h3>
                <p className="text-gray-600">Get paid quickly for quality work</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-green-100 p-2 rounded-lg">
                <Brain className="text-green-600" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Easy Tasks</h3>
                <p className="text-gray-600">No special skills required to get started</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-green-100 p-2 rounded-lg">
                <TrendingUp className="text-green-600" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Track Performance</h3>
                <p className="text-gray-600">See your stats and earnings in real-time</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Start Earning?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of trainers earning money by helping AI get smarter
          </p>
          <Link
            to="/register"
            className="inline-block bg-white hover:bg-gray-100 text-primary-600 font-semibold px-8 py-4 rounded-lg text-lg transition-colors"
          >
            Create Free Account
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-2xl font-bold mb-4">
            <span className="text-white">tr</span>
            <span className="text-primary-400">AI</span>
            <span className="text-white">n</span>
          </div>
          <p>&copy; 2024 trAIn. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
