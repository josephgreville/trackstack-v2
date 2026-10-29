import { useEffect, useState } from 'react';
import { cx } from '../utils/format';

export default function Community() {
  return (
    <section className="py-12">
      <div className="container-narrow">
        <header className="mb-8">
          <h1 className="text-3xl font-display font-700 tracking-tighter mb-2">
            Community
          </h1>
          <p className="text-lg text-brown">
            See what other collectors are listening to.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-paper rounded-lg p-6 shadow-sm border border-line">
            <h2 className="font-display font-600 mb-2">Coming soon</h2>
            <p className="text-sm text-brown">
              Community features — shared collections, reviews, and listening lists — are on the way.
            </p>
          </div>
          <div className="bg-paper rounded-lg p-6 shadow-sm border border-line">
            <h2 className="font-display font-600 mb-2">Your collections</h2>
            <p className="text-sm text-brown">
              Head to My Collections to manage your own albums and share them with friends.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
