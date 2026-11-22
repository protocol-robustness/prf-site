(ns canonical-comparison-reproduce
  "Reconstruct the published primary portable fixture using clean-room namespaces.")
(require '[prf-clean-room.composition :as canonical]
         '[prf-clean-room.portable :as portable])

(def document (portable/read-json (slurp "portable/vectors/pro-rata-v1.json")))
(def primary (first (filter #(= "primary" (:id %)) (portable/decode-pro-rata-v1 document))))
(def raw-primary (first (filter #(= "primary" (get % "id")) (get document "chains"))))
(def raw-result (get-in raw-primary ["artifacts" "result"]))
(def result (:result primary))
(def result-projection (dissoc result :allocation-result/root))
(def observed-bytes (canonical/canonical-bytes result-projection))
(def observed-byte-hex (apply str (map #(format "%02x" (bit-and % 0xff)) observed-bytes)))
(def expected-byte-hex (get raw-result "canonicalByteHex"))
(def observed-root (:allocation-result/root result))
(def expected-root (get raw-result "root"))

(assert (= expected-byte-hex observed-byte-hex) "Clojure canonical bytes differ from the frozen fixture")
(assert (= expected-root observed-root) "Clojure result root differs from the frozen fixture")
(println "Clojure primary fixture: PASS")
(println (str "result root: " observed-root))
(println (str "canonical bytes match: " (= expected-byte-hex observed-byte-hex)))
