'use client';
import { Component } from 'react';

interface Props { children: React.ReactNode; }
interface State { error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 20, color: '#ef4444', fontFamily: 'monospace', whiteSpace: 'pre-wrap', fontSize: 13 }}>
          <h3 style={{color:'#f59e0b'}}>Runtime Error:</h3>
          <p>{this.state.error.message}</p>
          <details style={{marginTop:8}}>
            <summary style={{cursor:'pointer',color:'#8b949e'}}>Stack Trace</summary>
            <p style={{fontSize:11,color:'#6e7681'}}>{this.state.error.stack}</p>
          </details>
          <button onClick={() => this.setState({error:null})} style={{marginTop:12,padding:'6px 16px',border:'1px solid #30363d',borderRadius:6,background:'#161b22',color:'#c9d1d9',cursor:'pointer'}}>Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}
