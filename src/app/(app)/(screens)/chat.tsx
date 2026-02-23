import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
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
    if (!message.trim() || !conversationId) return;

    const text = message;

    setMessage("");

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

    await api.post("/ai/support", {
      conversationId,
      userId,
      message: text,
    });
  };

  /* ---------------- CLEAR CHAT ---------------- */

  const clearChat = async () => {
    if (!conversationId) return;

    await supabase
      .from("support_conversations")
      .delete()
      .eq("id", conversationId);

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
                <Image
                  source={{
                    uri: "https://i.pravatar.cc/150",
                  }}
                  style={styles.avatar}
                />

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

          {messages.map((msg, index) =>
            msg.sender === "user" ? (
              <UserBubble key={msg.id} text={msg.message} />
            ) : index === messages.length - 1 ? (
              <TypingBubble key={msg.id} text={msg.message} />
            ) : (
              <AgentBubble key={msg.id} text={msg.message} />
            ),
          )}
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

            <TouchableOpacity style={styles.send} onPress={sendMessage}>
              <PaperPlaneTilt size={20} weight="bold" color="#a1e633" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------- TYPING EFFECT ---------- */

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
    backgroundColor: "#fcfdfa",
  },

  header: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#e2e8d8",
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
    fontWeight: "700",
  },

  online: {
    fontSize: 9,
    color: "#a1e633",
    fontWeight: "700",
  },

  messages: {
    padding: 40,
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
    backgroundColor: "#f1f3f0",
    padding: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
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
    padding: 12,
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },

  userText: {
    fontWeight: "500",
  },

  footer: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderColor: "#e2e8d8",
    gap: 8,
  },

  attach: {
    justifyContent: "center",
  },

  inputWrap: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 999,
    paddingLeft: 14,
    paddingRight: 42,
  },

  input: {
    paddingVertical: 10,
  },

  send: {
    position: "absolute",
    right: 8,
    top: 8,
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
});
