import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
} from '~/components/ui/alert-dialog';
import { Text } from '~/components/ui/text';
import { H3, P, Muted, Small } from '~/components/ui/typography';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Separator } from '~/components/ui/separator';
import type { OutfitAnalysisResult } from '~/utils/types';
import { ViewGradient } from './ViewGradient';

interface ProfileAnalysisModalProps {
  open: boolean;
  onClose: () => void;
  result: OutfitAnalysisResult;
}

const GradeRow = ({ label, score, comment }: { label: string; score: number; comment: string }) => (
  <View style={styles.gradeRow}>
    <View style={{ flex: 1 }}>
      <Text className="font-semibold">{label}</Text>
      <Muted>{comment}</Muted>
    </View>
    <Text className="text-xl font-bold">{score.toFixed(1)}</Text>
  </View>
);

export function ProfileAnalysisModal({ open, onClose, result }: ProfileAnalysisModalProps) {
  const analysis = result.outfit_analysis;
  const grades = analysis.grades;

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <ViewGradient>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-2xl">Your Style Report</AlertDialogTitle>
            <P className="text-center italic text-muted-foreground">{analysis.overall_verdict} </P>
          </AlertDialogHeader>

          <ScrollView style={{ maxHeight: 600 }} showsVerticalScrollIndicator={false}>
            <View style={styles.scoreContainer}>
              <View style={styles.scoreBox}>
                <Text className="text-sm text-muted-foreground">Overall Score</Text>
                <Text className="text-2xl font-bold">{analysis.overall_score.toFixed(1)} / 5</Text>
              </View>
              <View style={styles.scoreBox}>
                <Text className="text-sm text-muted-foreground">Confidence</Text>
                <Text className="text-2xl font-bold">
                  {(analysis.confidence_score * 100).toFixed(0)}%
                </Text>
              </View>
            </View>
            <Separator className="my-4" />

            {/* Grades Section */}
            <View style={styles.section}>
              <H3 className="mb-3">Detailed Grades</H3>
              <Card>
                <CardContent className="pt-4">
                  <GradeRow
                    label="Popularity"
                    score={grades.popularity.score}
                    comment={grades.popularity.comment}
                  />
                  <Separator className="my-3" />
                  <GradeRow
                    label="Originality"
                    score={grades.originality.score}
                    comment={grades.originality.comment}
                  />
                  <Separator className="my-3" />
                  <GradeRow
                    label="Fit & Proportion"
                    score={grades.fit_and_proportion.score}
                    comment={grades.fit_and_proportion.comment}
                  />
                  <Separator className="my-3" />
                  <GradeRow
                    label="Color Harmony"
                    score={grades.color_harmony.score}
                    comment={grades.color_harmony.comment}
                  />
                  <Separator className="my-3" />
                  <GradeRow
                    label="Accessorization"
                    score={grades.accessorization_effectiveness.score}
                    comment={grades.accessorization_effectiveness.comment}
                  />
                </CardContent>
              </Card>
            </View>

            {/* Components Feedback Section */}
            <View style={styles.section}>
              <H3 className="mb-3">Feedback by Item</H3>
              {analysis.components_feedback.map((item, index) => (
                <Card key={index} className="mb-3">
                  <CardHeader>
                    <CardTitle className="flex-row items-center">
                      <Text>{item.description}</Text>
                      <Badge variant="secondary" className="ml-2">
                        {item.item_type}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Object.entries(item.feedback).map(([key, value]) => (
                      <P key={key} className="mb-1">
                        <Small className="font-bold capitalize">{key}: </Small>
                        <Muted>{value}</Muted>
                      </P>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </View>

            {/* Summary and Suggestions */}
            <View style={styles.section}>
              <H3 className="mb-2">Summary</H3>
              {analysis.summary_notes.map((note, i) => (
                <P key={i} className="mb-2 text-muted-foreground">
                  {' '}
                  • {note}
                </P>
              ))}
            </View>

            <View style={styles.section}>
              <H3 className="mb-2">Actionable Suggestions</H3>
              {analysis.actionable_suggestions.map((s, i) => (
                <P key={i} className="mb-2">
                  💡 {s}
                </P>
              ))}
            </View>
          </ScrollView>

          <AlertDialogFooter>
            <AlertDialogAction onPress={onClose}>
              <Text>Close</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </ViewGradient>
    </AlertDialog>
  );
}

const styles = StyleSheet.create({
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  scoreBox: {
    alignItems: 'center',
  },
  section: {
    marginVertical: 16,
  },
  gradeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
