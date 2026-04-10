import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import {
  ArrowLeft,
  DotsThree,
  Paperclip,
  PaperPlaneTilt,
} from "phosphor-react-native";

import { supabase } from "@/config/supabase";
import { useRouter } from "expo-router";
import { api } from "@/service/api";

export default function Chat() {
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);

  const [menuVisible, setMenuVisible] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  /* ---------------- USER ---------------- */

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUserId(data.session?.user?.id ?? null);
    };

    loadUser();
  }, []);

  /* ---------------- CREATE OR FETCH CONVERSATION ---------------- */

  useEffect(() => {
    if (!userId) return;

    let mounted = true;

    const initConversation = async () => {
      const { data: existing } = await supabase
        .from("support_conversations")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (!mounted) return;

      if (existing) {
        setConversationId(existing.id);
        return;
      }

      const { data } = await supabase
        .from("support_conversations")
        .insert({ user_id: userId })
        .select()
        .single();

      if (!mounted) return;

      setConversationId(data.id);
    };

    initConversation();

    return () => {
      mounted = false;
    };
  }, [userId]);

  /* ---------------- LOAD MESSAGES ---------------- */

  useEffect(() => {
    if (!conversationId) return;

    const loadMessages = async () => {
      const { data } = await supabase
        .from("support_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      setMessages(data || []);

      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: false });
      }, 200);
    };

    loadMessages();
  }, [conversationId]);

  /* ---------------- REALTIME ---------------- */

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase.channel(`support-${conversationId}`);

    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "support_messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload: any) => {
        const newMsg = payload.new;

        setMessages((prev) => {
          const cleaned = prev.filter(
            (m) =>
              !(
                m.pending &&
                m.sender === newMsg.sender &&
                m.message === newMsg.message
              ),
          );

          return [...cleaned, newMsg];
        });

        setTimeout(() => {
          scrollRef.current?.scrollToEnd({
            animated: true,
          });
        }, 120);
      },
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  /* ---------------- AUTO SCROLL ---------------- */

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({
        animated: true,
      });
    }, 120);
  }, [messages]);

  /* ---------------- SEND MESSAGE ---------------- */

  const sendMessage = async () => {
    if (!message.trim() || !conversationId || sending) return;

    const text = message;
    setChatError(null);

    setMessage("");
    setSending(true);

    const tempId = `temp-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        sender: "user",
        message: text,
        pending: true,
        created_at: new Date().toISOString(),
      },
    ]);

    scrollRef.current?.scrollToEnd({
      animated: true,
    });

    try {
      await api.post("/ai/support", {
        conversationId,
        userId,
        message: text,
      });
    } catch (error) {
      setMessages((prev) =>
        prev.filter((item) => item.id !== tempId),
      );
      setMessage(text);
      setChatError("Message failed to send. Please try again.");
    } finally {
      setSending(false);
    }
  };

  /* ---------------- CLEAR CHAT ---------------- */

  const clearChat = async () => {
    if (!conversationId) return;

    await supabase
      .from("support_messages")
      .delete()
      .eq("conversation_id", conversationId);

    setMessages([]);
    setMenuVisible(false);
  };

  /* ---------------- UI ---------------- */

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={10}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => router.back()}
            >
              <ArrowLeft size={20} color="#161b0e" />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <View style={styles.avatarWrapper}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>HK</Text>
                </View>

                <View style={styles.onlineDot} />
              </View>

              <View>
                <Text style={styles.name}>HireKar Support</Text>

                <Text style={styles.online}>ONLINE</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setMenuVisible(true)}
            >
              <DotsThree size={22} color="#161b0e" />
            </TouchableOpacity>
          </View>
        </View>

        {/* MESSAGES */}

        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messages}
        >
          <View style={styles.dayWrap}>
            <Text style={styles.dayText}>Today</Text>
          </View>

          {messages.map((msg) =>
            msg.sender === "user" ? (
              <UserBubble key={msg.id} text={msg.message} />
            ) : (
              <AgentBubble key={msg.id} text={msg.message} />
            ),
          )}
          {sending && <TypingBubble text="Support is replying..." />}
        </ScrollView>

        {/* MENU */}

        <Modal transparent visible={menuVisible} animationType="fade">
          <Pressable
            style={styles.menuOverlay}
            onPress={() => setMenuVisible(false)}
          >
            <View style={styles.menuBox}>
              <TouchableOpacity onPress={clearChat} style={styles.menuBtn}>
                <Text style={styles.clearText}>Clear Chat</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>

        {/* FOOTER */}

        <View style={styles.footer}>
          <TouchableOpacity style={styles.attach}>
            <Paperclip size={22} color="#6b7280" />
          </TouchableOpacity>

          <View style={styles.inputWrap}>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Type a message..."
              placeholderTextColor="#9ca3af"
              style={styles.input}
            />

            <TouchableOpacity
              style={[styles.send, sending && styles.sendDisabled]}
              onPress={sendMessage}
              disabled={sending}
            >
              <PaperPlaneTilt
                size={20}
                weight="bold"
                color={sending ? "#94a3b8" : "#a1e633"}
              />
            </TouchableOpacity>
          </View>
        </View>
        {chatError ? <Text style={styles.errorText}>{chatError}</Text> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const TypingBubble = ({ text }: any) => {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let i = 0;

    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i));
      i++;

      if (i > text.length) clearInterval(interval);
    }, 18);

    return () => clearInterval(interval);
  }, [text]);

  return <AgentBubble text={displayed} />;
};

const AgentBubble = ({ text }: any) => (
  <View style={styles.agentContainer}>
    <View style={styles.agentBubble}>
      <Text style={styles.agentText}>{text}</Text>
    </View>
  </View>
);

const UserBubble = ({ text }: any) => (
  <View style={styles.userContainer}>
    <View style={styles.userBubble}>
      <Text style={styles.userText}>{text}</Text>
    </View>
  </View>
);

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7faf7",
  },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#dde7d5",
    backgroundColor: "#ffffff",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconBtn: {
    width: 36,
    alignItems: "center",
  },

  headerCenter: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },

  avatarWrapper: {
    position: "relative",
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#d9f99d",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#365314",
    fontWeight: "900",
  },

  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#a1e633",
  },

  name: {
    fontWeight: "800",
    color: "#0f172a",
  },

  online: {
    fontSize: 9,
    color: "#a1e633",
    fontWeight: "700",
  },

  messages: {
    paddingHorizontal: 18,
    paddingVertical: 24,
    gap: 14,
  },

  dayWrap: {
    alignItems: "center",
  },

  dayText: {
    fontSize: 10,
    fontWeight: "700",
  },

  agentContainer: {
    maxWidth: "85%",
  },

  agentBubble: {
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8d8",
  },

  agentText: {
    fontSize: 14,
  },

  userContainer: {
    alignSelf: "flex-end",
    maxWidth: "85%",
  },

  userBubble: {
    backgroundColor: "#a1e633",
    padding: 14,
    borderRadius: 20,
    borderBottomRightRadius: 6,
  },

  userText: {
    fontWeight: "500",
  },

  footer: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderColor: "#dde7d5",
    gap: 8,
    backgroundColor: "#ffffff",
  },

  attach: {
    justifyContent: "center",
  },

  inputWrap: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 999,
    paddingLeft: 14,
    paddingRight: 42,
    borderWidth: 1,
    borderColor: "#dbe4de",
  },

  input: {
    paddingVertical: 10,
  },

  send: {
    position: "absolute",
    right: 8,
    top: 8,
  },
  sendDisabled: {
    opacity: 0.6,
  },

  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "flex-end",
    paddingTop: 70,
    paddingRight: 14,
  },

  menuBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: 160,
  },

  menuBtn: {
    padding: 14,
  },

  clearText: {
    color: "#ef4444",
    fontWeight: "600",
  },
  errorText: {
    color: "#dc2626",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#ffffff",
    fontWeight: "600",
  },
});
