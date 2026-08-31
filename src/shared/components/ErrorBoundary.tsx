import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './Text';
import { Colors, Spacing } from '@/src/shared/theme';
import { logger, newTraceId, flushLogs } from '@/src/shared/utils/logger';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

// Catches render/lifecycle errors in the component tree below it and logs
// them through the existing debug_logs trace pipeline instead of a
// dedicated crash-reporting SDK (decided against adding one this cycle —
// see context/progress-tracker.md's Observability section). Does NOT catch
// errors in event handlers or async code — see app/_layout.tsx's
// ErrorUtils.setGlobalHandler wiring for those, which is the actual
// "hard crash" case this exists alongside.
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const traceId = newTraceId();
    logger.error(traceId, 'uncaught_render_error', {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
    flushLogs();
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text variant="subtitle" style={styles.title}>Something went wrong</Text>
          <Text variant="body" color={Colors.text.secondary} style={styles.body}>
            Please restart the app. This has been reported automatically.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background,
    gap: Spacing.sm,
  },
  title: { textAlign: 'center' },
  body: { textAlign: 'center' },
});
