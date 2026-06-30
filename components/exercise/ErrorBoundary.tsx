"use client";
import React from "react";

interface State { error: Error | null }

export class ExerciseErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-4xl">⚠️</p>
          <p className="text-gray-400 text-sm">Something went wrong loading this exercise.</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm transition"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
