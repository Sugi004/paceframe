import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#091221'
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#091221'
  },
  loadingEyebrow: {
    color: '#ff8a57',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 10
  },
  loadingTitle: {
    color: '#f7fbff',
    fontSize: 24,
    fontWeight: '900'
  },
  screen: {
    flex: 1,
    backgroundColor: '#091221'
  },
  screenShell: {
    flex: 1
  },
  tabScreenHost: {
    flex: 1
  },
  transitionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 15, 29, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22
  },
  transitionCard: {
    width: '100%',
    borderRadius: 28,
    backgroundColor: '#102347',
    padding: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#020816',
    shadowOpacity: 0.35,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12
  },
  transitionOrbLarge: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(142,217,255,0.18)',
    right: -70,
    top: -80
  },
  transitionOrbSmall: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 999,
    backgroundColor: 'rgba(255,211,110,0.18)',
    right: 10,
    bottom: -60
  },
  transitionEyebrow: {
    color: '#8ed9ff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10
  },
  transitionTitle: {
    color: '#f7fbff',
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900',
    marginBottom: 10,
    maxWidth: '88%'
  },
  transitionBody: {
    color: '#cfe1ff',
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 18,
    maxWidth: '88%'
  },
  transitionBarStack: {
    gap: 10
  },
  transitionBar: {
    height: 12,
    borderRadius: 999,
    backgroundColor: '#dbe7ff'
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 24
  },
  pageContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24
  },
  assistantScreen: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 8
  },
  assistantTopBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12
  },
  assistantTopBarCopy: {
    flex: 1
  },
  assistantTopBarEyebrow: {
    color: '#8ed9ff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6
  },
  assistantTopBarTitle: {
    color: '#f7fbff',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
    marginBottom: 4
  },
  assistantTopBarSubtitle: {
    color: '#a8b7d4',
    fontSize: 13,
    lineHeight: 18
  },
  assistantTopBarActions: {
    alignItems: 'flex-end',
    gap: 8
  },
  assistantRetryButton: {
    borderRadius: 999,
    backgroundColor: '#102347',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  assistantRetryButtonLabel: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 12
  },
  assistantContextLine: {
    color: '#94a7ca',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 10
  },
  assistantConversationShell: {
    flex: 1,
    minHeight: 0,
    borderRadius: 30,
    backgroundColor: '#f7fbff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    shadowColor: '#061024',
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
    overflow: 'hidden'
  },
  authContent: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 40
  },
  authHeroCard: {
    backgroundColor: '#fef0d9',
    borderRadius: 30,
    padding: 22,
    marginBottom: 16
  },
  authBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18
  },
  authBrandCopy: {
    marginLeft: 14,
    flex: 1
  },
  authEyebrow: {
    color: '#ff6b3d',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 6
  },
  authBrandTitle: {
    color: '#51617d',
    fontSize: 15,
    lineHeight: 22
  },
  authTitle: {
    color: '#0f1730',
    fontSize: 34,
    lineHeight: 39,
    fontWeight: '900',
    marginBottom: 10
  },
  authSubtitle: {
    color: '#53627e',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16
  },
  authChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14
  },
  authFeatureGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  authFeatureCard: {
    width: '48%',
    borderRadius: 18,
    backgroundColor: '#fff7ea',
    padding: 14
  },
  authFeatureLabel: {
    color: '#7a87a0',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6
  },
  authFeatureValue: {
    color: '#0f1730',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20
  },
  authPanelCard: {
    backgroundColor: '#eef5ff',
    borderRadius: 26,
    padding: 18,
    marginBottom: 16
  },
  authPanelEyebrow: {
    color: '#4a6287',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 12
  },
  authModeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12
  },
  authModeChip: {
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 9,
    backgroundColor: '#dbe8fa',
    marginRight: 10,
    marginBottom: 10
  },
  authModeChipActive: {
    backgroundColor: '#0f1730'
  },
  authModeChipLabel: {
    color: '#415777',
    fontWeight: '800'
  },
  authModeChipLabelActive: {
    color: '#ffffff'
  },
  authInput: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#0f1730',
    marginBottom: 12
  },
  authMessageCard: {
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: '#dfeaf9',
    padding: 14
  },
  authMessageText: {
    color: '#50607c',
    lineHeight: 21
  },
  authSupportCard: {
    borderRadius: 24,
    backgroundColor: '#13294e',
    padding: 18
  },
  authSupportTitle: {
    color: '#9bdcff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8
  },
  authSupportBody: {
    color: '#eef6ff',
    fontSize: 15,
    lineHeight: 23
  },
  accountBar: {
    marginHorizontal: 18,
    marginTop: 12,
    marginBottom: 10,
    borderRadius: 22,
    backgroundColor: '#102347',
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  accountIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  accountPanelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  accountInlineLabel: {
    color: '#6d7d98',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginLeft: 10,
    marginBottom: 4
  },
  accountInlineEmail: {
    color: '#0f1730',
    fontWeight: '800',
    marginLeft: 10,
    maxWidth: 190
  },
  accountLabel: {
    color: '#8ed9ff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginLeft: 10,
    marginBottom: 2
  },
  accountEmail: {
    color: '#f5fbff',
    fontWeight: '700',
    marginLeft: 10,
    maxWidth: 180
  },
  accountButton: {
    borderRadius: 999,
    backgroundColor: '#ffd36e',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginLeft: 10
  },
  accountButtonLabel: {
    color: '#0f1730',
    fontWeight: '900'
  },
  disabledButton: {
    opacity: 0.45
  },
  pageIntro: {
    paddingHorizontal: 4,
    marginBottom: 6
  },
  pageEyebrow: {
    color: '#8ed9ff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8
  },
  pageTitle: {
    color: '#f7fbff',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    marginBottom: 8
  },
  pageSubtitle: {
    color: '#95a6c7',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10
  },
  heroCard: {
    backgroundColor: '#fef0d9',
    borderRadius: 28,
    padding: 22,
    marginBottom: 18,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
    shadowColor: '#061024',
    shadowOpacity: 0.28,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12
  },
  heroGlowLarge: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(111, 223, 255, 0.22)',
    right: -52,
    bottom: -68
  },
  heroGlowSmall: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 206, 126, 0.22)',
    right: 20,
    top: 36
  },
  heroFloatingMiniCard: {
    position: 'absolute',
    top: 22,
    right: 22,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minWidth: 118,
    backgroundColor: 'rgba(15,23,48,0.93)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#061024',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10
  },
  heroFloatingMiniLabel: {
    color: '#8ed9ff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4
  },
  heroFloatingMiniValue: {
    color: '#f7fbff',
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'capitalize'
  },
  heroEyebrow: {
    color: '#ff6b3d',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 8
  },
  heroTitle: {
    color: '#0f1730',
    fontSize: 32,
    lineHeight: 37,
    fontWeight: '900',
    marginBottom: 10,
    maxWidth: '72%'
  },
  heroSubtitle: {
    color: '#4f5d79',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    maxWidth: '74%'
  },
  heroChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14
  },
  heroChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginRight: 10,
    marginBottom: 10
  },
  heroChipWarm: {
    backgroundColor: '#ffd7c9'
  },
  heroChipCool: {
    backgroundColor: '#d1f6ff'
  },
  heroChipWarning: {
    backgroundColor: '#ffe0a8'
  },
  heroChipDanger: {
    backgroundColor: '#ffd0d0'
  },
  heroChipLabel: {
    color: '#0f1730',
    fontWeight: '700'
  },
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  heroStatCard: {
    width: '48%',
    backgroundColor: '#fff7ea',
    borderRadius: 18,
    padding: 14
  },
  heroStatValue: {
    color: '#0f1730',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4
  },
  heroStatLabel: {
    color: '#65748f',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  heroSignalCard: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: '#102347'
  },
  heroSignalTitle: {
    color: '#8ed9ff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 8,
    textTransform: 'uppercase'
  },
  heroSignalBody: {
    color: '#f5fbff',
    lineHeight: 22
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#101c32'
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#101c32',
    borderRadius: 999,
    padding: 5,
    marginHorizontal: 18,
    marginTop: 8,
    marginBottom: 16
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 999,
    paddingVertical: 10
  },
  tabActive: {
    backgroundColor: '#f7fbff'
  },
  tabLabel: {
    color: '#9fafc9',
    fontWeight: '700',
    fontSize: 10
  },
  tabLabelActive: {
    color: '#0f1730'
  },
  card: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: '#f7fbff',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#061024',
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8
  },
  cardNavy: {
    backgroundColor: '#102347'
  },
  cardWarm: {
    backgroundColor: '#ffe3c0'
  },
  cardTeal: {
    backgroundColor: '#cdf7ee'
  },
  cardLime: {
    backgroundColor: '#e6f9c8'
  },
  cardTitle: {
    color: '#0f1730',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 6
  },
  cardTitleLight: {
    color: '#ffffff'
  },
  cardSubtitle: {
    color: '#5d6a86',
    lineHeight: 21,
    marginBottom: 14
  },
  cardSubtitleLight: {
    color: '#cfe4ff'
  },
  lightBody: {
    color: '#153141',
    lineHeight: 22
  },
  inverseTitle: {
    color: '#ffffff',
    fontWeight: '800',
    marginBottom: 4
  },
  inverseBody: {
    color: '#cfe1ff',
    lineHeight: 20,
    maxWidth: 220
  },
  energyConfirmCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    shadowColor: '#061024',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5
  },
  energyConfirmEyebrow: {
    color: '#8ed9ff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.05,
    textTransform: 'uppercase',
    marginBottom: 10
  },
  energyConfirmTitle: {
    color: '#ffffff',
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '900',
    marginBottom: 8
  },
  energyConfirmBody: {
    color: '#cfe1ff',
    lineHeight: 21,
    marginBottom: 14
  },
  energyConfirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  energyConfirmSegment: {
    width: '31%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 11,
    alignItems: 'center'
  },
  energyConfirmSegmentActive: {
    backgroundColor: '#ffd36e',
    borderColor: '#ffd36e'
  },
  energyConfirmSegmentLabel: {
    color: '#f7fbff',
    fontWeight: '800',
    textTransform: 'capitalize'
  },
  energyConfirmSegmentLabelActive: {
    color: '#0f1730'
  },
  energyConfirmFootnote: {
    color: '#9fb8da',
    fontSize: 12,
    lineHeight: 18
  },
  aiCoachBox: {
    marginTop: 14,
    backgroundColor: '#163056',
    borderRadius: 18,
    padding: 14
  },
  aiCoachTitle: {
    color: '#ffffff',
    fontWeight: '800',
    marginBottom: 8
  },
  aiCoachAction: {
    color: '#ffd36e',
    fontWeight: '800',
    marginTop: 10,
    lineHeight: 20
  },
  aiCoachBoundary: {
    color: '#9ddcff',
    fontWeight: '700',
    marginTop: 8,
    lineHeight: 20
  },
  aiMetaBox: {
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 12
  },
  aiMetaTitle: {
    color: '#ffffff',
    fontWeight: '800',
    marginBottom: 6
  },
  aiMetaBody: {
    color: '#cfe1ff',
    lineHeight: 20
  },
  aiRefreshButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#ffd36e',
    paddingHorizontal: 14,
    paddingVertical: 9
  },
  aiRefreshButtonLabel: {
    color: '#0f1730',
    fontWeight: '900'
  },
  aiStatusRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  aiStatusPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  aiStatusPillReady: {
    backgroundColor: '#c8f5de'
  },
  aiStatusPillError: {
    backgroundColor: '#ffd0d0'
  },
  aiStatusPillLabel: {
    color: '#0f1730',
    fontWeight: '800'
  },
  assistantSignalInline: {
    marginLeft: 10,
    color: '#a8b7d4',
    fontSize: 12,
    lineHeight: 16,
    flex: 1
  },
  aiThinkingCard: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: '#102347',
    marginTop: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  aiThinkingEyebrow: {
    color: '#8ed9ff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8
  },
  aiThinkingTitle: {
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    marginBottom: 8
  },
  aiThinkingBody: {
    color: '#cfe1ff',
    lineHeight: 21,
    marginBottom: 14
  },
  aiThinkingBarStack: {
    gap: 8
  },
  aiThinkingBar: {
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(142,217,255,0.85)'
  },
  promptChipRow: {
    paddingRight: 8,
    marginBottom: 12
  },
  promptChip: {
    borderRadius: 999,
    backgroundColor: '#edf4ff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(15,23,48,0.08)'
  },
  promptChipLabel: {
    color: '#24406a',
    fontWeight: '700'
  },
  quickAskGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  quickAskStrip: {
    paddingTop: 8,
    paddingBottom: 2,
    paddingRight: 6,
    marginTop: 8
  },
  quickAskChip: {
    borderRadius: 999,
    backgroundColor: '#fff2dc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(15,23,48,0.06)'
  },
  quickAskChipLabel: {
    color: '#173056',
    lineHeight: 18,
    fontSize: 12,
    fontWeight: '800'
  },
  quickAskCard: {
    width: '48%',
    borderRadius: 20,
    padding: 14,
    backgroundColor: '#fff2dc',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(15,23,48,0.06)',
    shadowColor: '#061024',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3
  },
  quickAskLabel: {
    color: '#173056',
    lineHeight: 21,
    fontWeight: '800'
  },
  carouselTrack: {
    paddingRight: 8
  },
  carouselPanel: {
    width: 248,
    borderRadius: 24,
    padding: 18,
    marginRight: 12,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    shadowColor: '#061024',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7
  },
  focusLanePrimary: {
    borderRadius: 24,
    padding: 18,
    width: '100%',
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    shadowColor: '#061024',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7,
    marginBottom: 12
  },
  focusLaneSecondaryTrack: {
    paddingRight: 8
  },
  carouselPanelNavy: {
    backgroundColor: '#102347'
  },
  carouselPanelWarm: {
    backgroundColor: '#ffe7c6'
  },
  carouselPanelTeal: {
    backgroundColor: '#cdf7ee'
  },
  carouselPanelLime: {
    backgroundColor: '#e6f9c8'
  },
  carouselPanelSoft: {
    backgroundColor: '#edf4ff'
  },
  carouselPanelDeep: {
    backgroundColor: '#163056',
    paddingTop: 76
  },
  carouselEyebrow: {
    color: '#8ed9ff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.05,
    textTransform: 'uppercase',
    marginBottom: 10
  },
  carouselEyebrowDark: {
    color: '#59708f',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.05,
    textTransform: 'uppercase',
    marginBottom: 10
  },
  carouselTitleLight: {
    color: '#ffffff',
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '900',
    marginBottom: 8
  },
  carouselTitleDark: {
    color: '#0f1730',
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '900',
    marginBottom: 8
  },
  carouselBodyLight: {
    color: '#d6e7ff',
    lineHeight: 22
  },
  carouselBodyDark: {
    color: '#40506d',
    lineHeight: 22
  },
  carouselMetaLight: {
    color: '#8ed9ff',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 14
  },
  carouselMetaDark: {
    color: '#6a7892',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 14
  },
  carouselActionPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#0f1730',
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginTop: 14
  },
  carouselActionPillLabel: {
    color: '#ffffff',
    fontWeight: '800'
  },
  carouselScoreDark: {
    color: '#0f1730',
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
    marginBottom: 10
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  metricPill: {
    width: '48%',
    backgroundColor: '#eaf2ff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12
  },
  metricPillLabel: {
    color: '#71819e',
    fontSize: 12,
    marginBottom: 6
  },
  metricPillValue: {
    color: '#0f1730',
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'capitalize'
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  summaryItem: {
    width: '31%',
    backgroundColor: '#163056',
    borderRadius: 18,
    padding: 12
  },
  summaryValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6
  },
  summaryLabel: {
    color: '#bcd3f7',
    fontSize: 12
  },
  listCard: {
    backgroundColor: '#eaf2ff',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.46)',
    shadowColor: '#061024',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  },
  listText: {
    flex: 1,
    paddingRight: 12
  },
  listTitle: {
    color: '#0f1730',
    fontWeight: '800',
    marginBottom: 4
  },
  listMeta: {
    color: '#61708d',
    lineHeight: 20
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  badgeOpen: {
    backgroundColor: '#d7e6ff'
  },
  badgeDone: {
    backgroundColor: '#c8f5de'
  },
  badgeMuted: {
    backgroundColor: '#f3d9b7'
  },
  badgeLabel: {
    color: '#0f1730',
    fontWeight: '800'
  },
  input: {
    borderRadius: 16,
    backgroundColor: '#fff5e7',
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#0f1730',
    marginBottom: 12
  },
  segmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  segment: {
    width: '31%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e6a97f',
    paddingVertical: 10,
    alignItems: 'center'
  },
  segmentActive: {
    backgroundColor: '#0f1730',
    borderColor: '#0f1730'
  },
  segmentLabel: {
    color: '#9b5d35',
    fontWeight: '700',
    textTransform: 'capitalize'
  },
  segmentLabelActive: {
    color: '#ffffff'
  },
  primaryButton: {
    backgroundColor: '#0f1730',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center'
  },
  primaryButtonLabel: {
    color: '#ffffff',
    fontWeight: '900'
  },
  secondaryButton: {
    backgroundColor: '#0f1730',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center'
  },
  secondaryButtonLabel: {
    color: '#ffffff',
    fontWeight: '900'
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 4
  },
  simpleRow: {
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.42)'
  },
  inlineGuideStack: {
    marginTop: 14
  },
  simpleRowDark: {
    backgroundColor: '#163056',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)'
  },
  completedRow: {
    backgroundColor: 'rgba(255,255,255,0.42)',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.46)',
    shadowColor: '#061024',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  },
  completedTitle: {
    color: '#50607c',
    fontWeight: '800',
    marginBottom: 4,
    textDecorationLine: 'line-through'
  },
  metricControl: {
    backgroundColor: 'rgba(255,255,255,0.42)',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  metricControlRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  metricButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: '#0f1730',
    alignItems: 'center',
    justifyContent: 'center'
  },
  metricButtonLabel: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900'
  },
  metricValue: {
    color: '#0f1730',
    fontWeight: '900',
    minWidth: 50,
    textAlign: 'center'
  },
  metricValueWide: {
    color: '#0f1730',
    fontWeight: '900',
    minWidth: 62,
    textAlign: 'center'
  },
  noteBox: {
    backgroundColor: '#eaf2ff',
    borderRadius: 16,
    padding: 14,
    marginTop: 4
  },
  noteLabel: {
    color: '#73819b',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase'
  },
  noteText: {
    color: '#53627e',
    lineHeight: 21
  },
  fieldLabel: {
    color: '#50607c',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 4
  },
  helperBody: {
    color: '#5c6b86',
    lineHeight: 21,
    marginBottom: 8,
    fontSize: 13
  },
  assistantReplyCard: {
    marginTop: 6,
    borderRadius: 20,
    padding: 16,
    backgroundColor: '#edf4ff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.48)',
    shadowColor: '#061024',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  },
  assistantReplyHeadline: {
    color: '#5c6f92',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8
  },
  assistantReplyBody: {
    color: '#0f1730',
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
    marginBottom: 10
  },
  assistantStepsStack: {
    marginBottom: 10,
    gap: 6
  },
  assistantReplyStep: {
    color: '#1d3254',
    lineHeight: 22,
    fontWeight: '700'
  },
  assistantReplyMeta: {
    color: '#1d3254',
    fontWeight: '800',
    marginBottom: 8,
    lineHeight: 21
  },
  assistantReplySupport: {
    color: '#5c6b86',
    lineHeight: 21
  },
  assistantReplyFollowUp: {
    color: '#35517f',
    lineHeight: 21,
    marginTop: 10,
    fontWeight: '700'
  },
  assistantThreadScroll: {
    flex: 1,
    minHeight: 0
  },
  assistantThreadContent: {
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10
  },
  assistantThreadContentEmpty: {
    justifyContent: 'center'
  },
  assistantThreadContentActive: {
    justifyContent: 'flex-end'
  },
  threadStack: {
    paddingBottom: 6
  },
  threadBubble: {
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    maxWidth: '84%'
  },
  threadBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#0f1730',
    borderBottomRightRadius: 8
  },
  threadBubbleAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: '#edf4ff',
    borderWidth: 1,
    borderColor: 'rgba(15,23,48,0.06)',
    borderBottomLeftRadius: 8
  },
  threadRole: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
    color: '#8b9bb8'
  },
  threadText: {
    lineHeight: 22,
    fontWeight: '700'
  },
  threadTextUser: {
    color: '#f7fbff'
  },
  threadTextAssistant: {
    color: '#102347'
  },
  threadMeta: {
    marginTop: 8,
    color: '#5c6b86',
    lineHeight: 20,
    fontWeight: '700'
  },
  emptyAIState: {
    borderRadius: 20,
    padding: 18,
    backgroundColor: '#eef5ff',
    borderWidth: 1,
    borderColor: 'rgba(15,23,48,0.06)',
    marginBottom: 10
  },
  emptyAIStateTitle: {
    color: '#102347',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8
  },
  emptyAIStateBody: {
    color: '#5c6b86',
    lineHeight: 21
  },
  chatComposerDock: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(15,23,48,0.08)',
    paddingTop: 8,
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: '#f7fbff'
  },
  chatComposerShell: {
    borderRadius: 24,
    backgroundColor: '#eef5ff',
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(15,23,48,0.06)'
  },
  chatComposerInput: {
    borderRadius: 18,
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#0f1730',
    minHeight: 50,
    maxHeight: 96,
    textAlignVertical: 'top',
    marginBottom: 6
  },
  chatComposerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  chatSendButton: {
    minWidth: 108
  },
  settingsInput: {
    borderRadius: 16,
    backgroundColor: '#eaf2ff',
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#0f1730',
    marginBottom: 12
  },
  textArea: {
    backgroundColor: '#eaf2ff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#0f1730',
    minHeight: 92,
    textAlignVertical: 'top',
    marginBottom: 12
  },
  setupPrimaryButton: {
    marginBottom: 18
  },
  protocolRow: {
    backgroundColor: '#163056',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    marginBottom: 10
  },
  protocolDuration: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#ffd36e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12
  },
  protocolDurationLabel: {
    color: '#0f1730',
    fontWeight: '900'
  },
  protocolTitle: {
    color: '#ffffff',
    fontWeight: '800',
    marginBottom: 4,
    lineHeight: 24
  },
  protocolDescription: {
    color: '#cfe1ff',
    lineHeight: 22
  },
  reminderPreviewRow: {
    backgroundColor: '#163056',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  reminderTime: {
    color: '#ffd36e',
    fontWeight: '900'
  },
  reminderControlCard: {
    backgroundColor: 'rgba(255,255,255,0.48)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#061024',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  timeAdjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  timeAdjustButton: {
    borderRadius: 999,
    backgroundColor: '#0f1730',
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  timeAdjustLabel: {
    color: '#ffffff',
    fontWeight: '800'
  },
  reminderTimeDark: {
    color: '#0f1730',
    fontWeight: '900',
    fontSize: 16
  },
  protocolDurationFloating: {
    position: 'absolute',
    top: 18,
    left: 18,
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#ffd36e',
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  essentialsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  essentialChip: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.55)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)'
  },
  essentialChipLabel: {
    color: '#254343',
    fontWeight: '800'
  }
});
